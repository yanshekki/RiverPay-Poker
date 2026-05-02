import { useRef, useState, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { socket } from '../../services/socket';

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function getMimeType() {
  for (const mt of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mt)) return mt;
  }
  return ''; // browser default
}

export default function VoiceChat({ roomId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef('');

  // Pre-request mic on mount so push-to-talk is instant
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        mimeRef.current = getMimeType();
        setMicReady(true);
      } catch (err) {
        console.error('Mic permission denied:', err);
      }
    })();
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    try {
      chunksRef.current = [];
      const opts = mimeRef.current ? { mimeType: mimeRef.current } : {};
      const recorder = new MediaRecorder(stream, opts);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (chunksRef.current.length === 0) return;
        const mime = mimeRef.current || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] });
        // Convert blob to ArrayBuffer for socket transport
        blob.arrayBuffer().then(buf => {
          socket.emit('sendVoice', { roomId, audioBuffer: buf });
        });
        chunksRef.current = [];
      };

      recorder.start(200); // 200ms slices
      setIsRecording(true);
    } catch (err) {
      console.error('Recorder start failed:', err);
    }
  }, [roomId]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    setIsRecording(false);
  }, []);

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={(e) => { if (isRecording) stopRecording(); }}
      onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
      onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
      onTouchCancel={stopRecording}
      className={`p-2.5 rounded-full transition-all touch-target ${
        isRecording
          ? 'bg-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]'
          : micReady
            ? 'bg-white/10 hover:bg-white/20 border border-white/10'
            : 'bg-white/5 border border-white/5 opacity-50'
      }`}
      aria-label={isRecording ? 'Recording' : 'Push to talk'}
    >
      {isRecording ? <Mic size={18} className="text-white" /> : <MicOff size={18} className={micReady ? 'text-neutral-400' : 'text-neutral-600'} />}
    </button>
  );
}
