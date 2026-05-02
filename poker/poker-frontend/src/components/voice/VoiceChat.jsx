import { useRef, useState, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
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
  return '';
}

export default function VoiceChat({ roomId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [micState, setMicState] = useState('idle'); // idle | ready | denied
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef('');

  const requestMic = useCallback(async () => {
    if (micState === 'ready') return; // Already have permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeRef.current = getMimeType();
      setMicState('ready');
    } catch (err) {
      console.error('Mic denied:', err);
      setMicState('denied');
    }
  }, [micState]);

  const startRecording = useCallback(async () => {
    // First click: request microphone
    if (micState !== 'ready') {
      await requestMic();
      if (micState !== 'ready' && streamRef.current) {
        // Stream was just granted, update state
        setMicState('ready');
      }
      if (!streamRef.current) return; // Still no permission
    }

    try {
      chunksRef.current = [];
      const opts = mimeRef.current ? { mimeType: mimeRef.current } : {};
      const recorder = new MediaRecorder(streamRef.current, opts);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (chunksRef.current.length === 0) return;
        const mime = mimeRef.current || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] });
        blob.arrayBuffer().then(buf => {
          socket.emit('sendVoice', { roomId, audioBuffer: buf });
        });
        chunksRef.current = [];
      };

      recorder.start(200);
      setIsRecording(true);
    } catch (err) {
      console.error('Recorder start failed:', err);
    }
  }, [roomId, micState, requestMic]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    setIsRecording(false);
  }, []);

  const handleMouseDown = () => startRecording();
  const handleMouseUp = () => { if (isRecording) stopRecording(); };
  const handleTouchStart = (e) => { e.preventDefault(); startRecording(); };
  const handleTouchEnd = (e) => { e.preventDefault(); if (isRecording) stopRecording(); };

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleMouseUp}
      className={`p-2.5 rounded-full transition-all touch-target relative ${
        isRecording
          ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]'
          : micState === 'denied'
            ? 'bg-white/5 border border-red-500/30'
            : micState === 'ready'
              ? 'bg-white/10 hover:bg-white/20 border border-white/10'
              : 'bg-white/10 hover:bg-white/20 border border-white/10 cursor-pointer'
      }`}
      aria-label={isRecording ? 'Recording' : micState === 'denied' ? 'Mic blocked' : micState === 'ready' ? 'Push to talk' : 'Enable mic'}
      title={micState === 'denied' ? 'Microphone blocked — check browser permissions' : micState === 'ready' ? 'Hold to talk' : 'Tap to enable microphone'}
    >
      {isRecording ? (
        <Mic size={18} className="text-white" />
      ) : micState === 'denied' ? (
        <AlertCircle size={18} className="text-red-400" />
      ) : (
        <MicOff size={18} className={micState === 'ready' ? 'text-rp-cyan' : 'text-neutral-400'} />
      )}
    </button>
  );
}
