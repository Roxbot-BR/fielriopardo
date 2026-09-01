"use client";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import api, { getAuthHeader } from "@/lib/api";
import { User } from "@/types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMaster: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem("fiel_token");
    const u = localStorage.getItem("fiel_user");
    if (t && u) {
      try {
        setToken(t);
        const parsed = JSON.parse(u);
        setUser(parsed);
        setCookie("fiel_token", t);
        api.get("/auth/me", { headers: { Authorization: getAuthHeader(t) } })
          .then(({ data }) => {
            const fresh = { ...parsed, ...data };
            if (JSON.stringify(fresh) !== JSON.stringify(parsed)) {
              setUser(fresh);
              localStorage.setItem("fiel_user", JSON.stringify(fresh));
            }
          })
          .catch(() => { /* keep cached user */ });
      } catch {
        localStorage.removeItem("fiel_token");
        localStorage.removeItem("fiel_user");
        deleteCookie("fiel_token");
      }
    }
    setLoading(false);
  }, []);

  const persist = (t: string, u: User, rt?: string) => {
    localStorage.setItem("fiel_token", t);
    localStorage.setItem("fiel_user", JSON.stringify(u));
    setCookie("fiel_token", t, 30);
    if (rt) localStorage.setItem("fiel_refresh_token", rt);
    setToken(t);
    setUser(u);
    return u;
  };

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post("/auth/login", { email, password });
    const tk = data.accessToken ?? data.access_token;
    const rt = data.refreshToken ?? data.refresh_token;
    return persist(tk, data.user, rt);
  };

  const register = async (form: Record<string, string>): Promise<User> => {
    const { data } = await api.post("/auth/register", form);
    const tk = data.accessToken ?? data.access_token;
    const rt = data.refreshToken ?? data.refresh_token;
    return persist(tk, data.user, rt);
  };

  const logout = () => {
    localStorage.removeItem("fiel_token");
    localStorage.removeItem("fiel_user");
    localStorage.removeItem("fiel_refresh_token");
    deleteCookie("fiel_token");
    setToken(null);
    setUser(null);
    window.location.href = "/";
  };

  const value = useMemo(() => {
    const roles = user?.roles ?? [];
    return {
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      isMaster: roles.includes("MASTER" as any),
      isAdmin:  roles.includes("ADMIN" as any) || roles.includes("MASTER" as any),
      login, register, logout,
    };
  }, [user, token, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
