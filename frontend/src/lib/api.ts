import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Base URL: for server-side (SSR), use internal Docker URL; for browser, use the domain
const getBaseURL = () => {
  if (typeof window === 'undefined') {
    // Server-side: call backend directly inside Docker network
    return 'http://backend:3001/api';
  }
  // Client-side: use the public domain with /api prefix
  return `${process.env.NEXT_PUBLIC_API_URL || 'https://fielriopardo.com.br'}/api`;
};

export const API_URL = typeof window !== 'undefined'
  ? `${process.env.NEXT_PUBLIC_API_URL || 'https://fielriopardo.com.br'}/api`
  : 'http://backend:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fiel_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && typeof window !== 'undefined' && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('fiel_refresh_token');

      if (refreshToken) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise((resolve) => {
            refreshQueue.push((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await axios.post(
            `${getBaseURL()}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          const newToken = data.accessToken ?? data.access_token;
          const newRefresh = data.refreshToken ?? data.refresh_token;

          localStorage.setItem('fiel_token', newToken);
          if (newRefresh) localStorage.setItem('fiel_refresh_token', newRefresh);

          // Update cookie (30 days)
          const expires = new Date(Date.now() + 30 * 864e5).toUTCString();
          document.cookie = `fiel_token=${newToken}; expires=${expires}; path=/; SameSite=Lax`;

          // Flush queued requests
          refreshQueue.forEach(cb => cb(newToken));
          refreshQueue = [];

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear everything and redirect to login
          localStorage.removeItem('fiel_token');
          localStorage.removeItem('fiel_user');
          localStorage.removeItem('fiel_refresh_token');
          document.cookie = 'fiel_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
          refreshQueue = [];
          window.location.href = '/bolao/entrar';
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token — redirect if not on public page
        const publicPaths = ['/bolao/entrar', '/bolao/cadastro', '/'];
        const isPublicPath = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '?'));
        if (!isPublicPath) {
          localStorage.removeItem('fiel_token');
          localStorage.removeItem('fiel_user');
          window.location.href = '/bolao/entrar';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
