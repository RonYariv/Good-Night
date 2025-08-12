// services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  socket!: Socket;

  connect() {
    this.socket = io('http://localhost:3000/rooms', {
      autoConnect: false,
    });
    this.socket.connect();
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void) {
    this.socket.once(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket.off(event, callback);
  }

  emit(event: string, data?: any) {
    this.socket.emit(event, data);
  }
}

export const socketService = new SocketService();