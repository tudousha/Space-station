
import React, { useRef, useEffect } from 'react';
import { CIRCULAR_GESTURE_SENSITIVITY } from '../constants';

interface CameraOverlayProps {
  onRotationDelta: (delta: number) => void;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ onRotationDelta }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    isClosingRef.current = false;

    // @ts-ignore (MediaPipe loaded via CDN globally)
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      // Defensive check: don't process if we are in the middle of closing
      if (isClosingRef.current || !ctx) return;
      
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        const tip = landmarks[8];
        const x = tip.x * canvas.width;
        const y = tip.y * canvas.height;

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        const wrist = landmarks[0];
        const cx = wrist.x * canvas.width;
        const cy = wrist.y * canvas.height;
        
        const currentAngle = Math.atan2(y - cy, x - cx);
        
        if (lastAngleRef.current !== null) {
          let delta = currentAngle - lastAngleRef.current;
          
          if (delta > Math.PI) delta -= 2 * Math.PI;
          if (delta < -Math.PI) delta += 2 * Math.PI;

          // Push the delta back to the parent
          onRotationDelta(delta * CIRCULAR_GESTURE_SENSITIVITY * 10);
        } else {
          // If tracking just started, clear previous deltas
          onRotationDelta(0);
        }
        
        lastAngleRef.current = currentAngle;
      } else {
        lastAngleRef.current = null;
        onRotationDelta(0);
      }
      ctx.restore();
    });

    // @ts-ignore
    const camera = new window.Camera(video, {
      onFrame: async () => {
        if (!isClosingRef.current && handsRef.current) {
          try {
            await handsRef.current.send({ image: video });
          } catch (e) {
            console.warn("MediaPipe send frame error", e);
          }
        }
      },
      width: 320,
      height: 240
    });
    cameraRef.current = camera;
    camera.start();

    return () => {
      console.log("Cleaning up MediaPipe...");
      isClosingRef.current = true;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        try {
          // Attempting to close can trigger SolutionWasm errors if async frames are pending
          // In some environments, it's safer to just let the worker die with the component
          handsRef.current.close();
        } catch (e) {
          console.error("Error closing MediaPipe hands", e);
        }
      }
      handsRef.current = null;
      cameraRef.current = null;
    };
  }, [onRotationDelta]);

  return (
    <div className="absolute top-4 right-4 w-40 h-30 bg-black/50 border border-blue-500 rounded-lg overflow-hidden shadow-lg z-[100]">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} width={320} height={240} className="w-full h-full transform scale-x-[-1]" />
      <div className="absolute inset-x-0 bottom-0 bg-blue-600/50 text-[10px] text-center uppercase py-1">
        Hand Sync Active
      </div>
    </div>
  );
};

export default CameraOverlay;
