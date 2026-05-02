import { useEffect, useRef } from 'react';
import { socket } from '../services/socket';

export function useVoiceChat() {
  const audioRef = useRef(null);

  useEffect(() => {
    const handler = (data) => {
      try {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const buf = data.audioBuffer;
        if (!buf) return;

        const blob = new Blob([buf], { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.play().catch((e) => {
          console.warn('Audio play failed (may need user gesture):', e.message);
        });

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
      } catch (err) {
        console.error('Voice playback error:', err);
      }
    };

    socket.on('receiveVoice', handler);
    return () => socket.off('receiveVoice', handler);
  }, []);

  return {};
}
