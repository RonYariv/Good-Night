// services/socketService.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL as string;

class SocketService {
  socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(SOCKET_URL, { autoConnect: false });
    this.socket.connect();
  }


  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void) {
    this.socket?.once(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();