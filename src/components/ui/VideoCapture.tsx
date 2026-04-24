import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './Button';
import { Video, StopCircle, RotateCcw, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { verifyVehicleInFrames } from '../../lib/openai';

interface VideoCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onFramesExtracted: (frames: string[]) => void;
  title?: string;
}

type RecordState = 'idle' | 'recording' | 'extracting' | 'verifying' | 'preview';

const FRAME_COUNT = 10; // frames extracted from the video
const MIN_DURATION = 5; // minimum seconds before allowing stop

async function extractFrames(blob: Blob, count: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(blob);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration < 0.5) {
        URL.revokeObjectURL(url);
        resolve([]);
        return;
      }

      const frames: string[] = [];
      const interval = duration / (count + 1);

      for (let i = 1; i <= count; i++) {
        video.currentTime = interval * i;
        await new Promise<void>(res => {
          video.onseeked = () => res();
          // fallback timeout in case onseeked never fires
          setTimeout(res, 400);
        });
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.75));
      }

      URL.revokeObjectURL(url);
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Video load failed'));
    };
  });
}

export const VideoCapture: React.FC<VideoCaptureProps> = ({ isOpen, onClose, onFramesExtracted, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setState('idle');
    setElapsed(0);
    setFrames([]);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setError('Camera access denied. Please allow camera permissions.'));

    return stopStream;
  }, [isOpen, stopStream]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setElapsed(0);

    const mimeType = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      .find(t => MediaRecorder.isTypeSupported(t)) || '';

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(100);
    recorderRef.current = recorder;

    setState('recording');
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setState('extracting');

    await new Promise<void>(res => {
      recorderRef.current!.onstop = () => res();
      recorderRef.current!.stop();
    });

    const blob = new Blob(chunksRef.current, { type: recorderRef.current.mimeType || 'video/webm' });
    try {
      const extracted = await extractFrames(blob, FRAME_COUNT);
      if (extracted.length === 0) throw new Error('No frames extracted — video may be too short.');

      // Verify the video actually shows a vehicle
      setState('verifying');
      const check = await verifyVehicleInFrames(extracted);
      if (!check.ok) {
        setError(`Vehicle not detected: ${check.reason} Please retake the video showing the full vehicle.`);
        setState('idle');
        return;
      }

      setFrames(extracted);
      setState('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Frame extraction failed.');
      setState('idle');
    }
  };

  const handleRetake = () => {
    setFrames([]);
    setElapsed(0);
    setState('idle');
  };

  const handleConfirm = () => {
    onFramesExtracted(frames);
    stopStream();
    onClose();
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const canStop = elapsed >= MIN_DURATION;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#000',
      display: 'flex', flexDirection: 'column', zIndex: 10000,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', color: 'white', flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{title || 'Vehicle Walkthrough'}</span>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
      </div>

      {/* Video preview */}
      {state !== 'preview' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {error && state !== 'idle' ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
              {error}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {state === 'recording' && (
                <div style={{
                  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                  padding: '6px 16px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', animation: 'blink 1s step-start infinite' }} />
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(elapsed)}</span>
                </div>
              )}
              {(state === 'extracting' || state === 'verifying') && (
                <div style={{
                  position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 12,
                }}>
                  <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontWeight: 600 }}>
                    {state === 'extracting' ? 'Extracting frames...' : 'Verifying vehicle...'}
                  </span>
                  {state === 'verifying' && (
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '0 24px' }}>
                      Checking that the video shows a vehicle
                    </span>
                  )}
                </div>
              )}
              {error && state === 'idle' && (
                <div style={{
                  position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 12, padding: '24px', textAlign: 'center',
                }}>
                  <AlertTriangle size={40} style={{ color: '#ef4444' }} />
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>Retake Required</span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>{error}</span>
                  <button onClick={() => setError(null)} style={{ marginTop: 8, padding: '8px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                    Try Again
                  </button>
                </div>
              )}
              {state === 'idle' && (
                <div style={{
                  position: 'absolute', bottom: 80, left: 0, right: 0,
                  textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', padding: '0 24px',
                }}>
                  Walk slowly around the entire vehicle in a full circle
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Frame preview */}
      {state === 'preview' && (
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#111', padding: '12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', marginBottom: '10px', textAlign: 'center' }}>
            {frames.length} frames extracted — review before confirming
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
            {frames.map((f, i) => (
              <div key={i} style={{ aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#222' }}>
                <img src={f} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        padding: '16px 24px', backgroundColor: '#111',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexShrink: 0,
      }}>
        {state === 'idle' && !error && (
          <button
            onClick={startRecording}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              backgroundColor: '#ef4444', border: '4px solid white',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Video size={28} color="white" />
          </button>
        )}
        {state === 'recording' && (
          <>
            <button
              onClick={stopRecording}
              disabled={!canStop}
              title={!canStop ? `Record at least ${MIN_DURATION}s` : 'Stop recording'}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                backgroundColor: canStop ? '#ef4444' : '#555',
                border: '4px solid white',
                cursor: canStop ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.3s',
              }}
            >
              <StopCircle size={28} color="white" />
            </button>
            {!canStop && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>
                Min {MIN_DURATION}s
              </span>
            )}
          </>
        )}
        {state === 'preview' && (
          <>
            <Button variant="secondary" onClick={handleRetake} style={{ backgroundColor: '#222', borderColor: '#555', color: 'white' }}>
              <RotateCcw size={16} /> Retake
            </Button>
            <Button onClick={handleConfirm} style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
              <CheckCircle2 size={16} /> Use These Frames
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
