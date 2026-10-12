/**
 * Socket.IO client singleton.
 * The socket is created once with the current JWT and reused.
 * Call `connectSocket()` after login, `disconnectSocket()` on logout.
 */
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem('cxc_token');
  if (!token) return null;

  if (socket && socket.connected) return socket;

  socket = io('/', {
    query: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
