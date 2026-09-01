import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'https://fielriopardo.com.br', {
      autoConnect: false,
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    s.auth = { token };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
