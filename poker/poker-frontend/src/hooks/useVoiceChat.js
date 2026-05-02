import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../services/socket';

export function useVoiceChat(roomId) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    socket.on('receiveVoice', (data) => {
      const audioBlob = new Blob([data.audioBuffer], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      new Audio(audioUrl).play();
    });
    return () => socket.off('receiveVoice');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        socket.emit('sendVoice', { roomId, audioBuffer: audioBlob });
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [roomId]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  }, []);

  return { isRecording, startRecording, stopRecording };
}
