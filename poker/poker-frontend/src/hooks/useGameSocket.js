import { useEffect, useRef, useState, useCallback } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

export function useGameSocket(roomId, token) {
  const [roomContract, setRoomContract] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!token) return;
    connectSocket(roomId);

    socket.on('roomContractInfo', ({ contractAddress }) => setRoomContract(contractAddress));
    socket.on('errorMsg', (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 5000); });

    return () => {
      socket.off('roomContractInfo'); socket.off('errorMsg');
      disconnectSocket();
    };
  }, [roomId, token]);

  const emit = useCallback((event, data) => {
    socket.emit(event, { roomId, ...data });
  }, [roomId]);

  return { roomContract, errorMsg, setErrorMsg, emit };
}
