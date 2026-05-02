import { io } from 'socket.io-client';
import { useStore } from '../store/useStore';
import { CONFIG } from '../config';

export const socket = io(CONFIG.SOCKET_URL, { autoConnect: false });

let connectHandlerSet = false;

export const connectSocket = (roomId) => {
  const token = useStore.getState().token;
  if (!token) { console.error('No JWT token'); return; }

  socket.auth = { token };

  if (!connectHandlerSet) {
    connectHandlerSet = true;
    socket.on('connect', () => {
      const pending = useStore.getState().pendingRoom;
      const targetRoomId = pending?.roomId || roomId;
      socket.emit('joinRoom', { roomId: targetRoomId });

      if (pending?.contractAddress) {
        socket.emit('roomCreated', {
          roomId: pending.roomId,
          contractAddress: pending.contractAddress,
          settings: pending.settings || {}
        });
        useStore.getState().clearPendingRoom();
      }
    });
  }

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
    if (err.message.includes('Authentication error')) {
      useStore.getState().logout();
      window.location.href = '/';
    }
  });

  if (!socket.connected) {
    socket.connect();
  } else {
    const pending = useStore.getState().pendingRoom;
    if (pending?.contractAddress) {
      socket.emit('roomCreated', { roomId: pending.roomId, contractAddress: pending.contractAddress, settings: pending.settings || {} });
      useStore.getState().clearPendingRoom();
    }
    socket.emit('joinRoom', { roomId });
  }
};

export const disconnectSocket = () => { socket.disconnect(); };
