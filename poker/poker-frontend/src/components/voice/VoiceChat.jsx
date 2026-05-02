import { useRef, useState, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { socket } from '../../services/socket';

export default function VoiceChat({ roomId }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

      mediaRecorderRef.current.start(100); // Capture in 100ms slices
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

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      onTouchCancel={stopRecording}
      className={`p-2.5 rounded-full transition-all touch-target ${
        isRecording
          ? 'bg-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]'
          : 'bg-white/10 hover:bg-white/20 border border-white/10'
      }`}
      aria-label={isRecording ? 'Recording' : 'Push to talk'}
    >
      {isRecording ? <Mic size={18} className="text-white" /> : <MicOff size={18} className="text-neutral-400" />}
    </button>
  );
}
