
import React, { useRef, useEffect, useState } from 'react';
import UIOverlay from './UIOverlay';
import { GameState, DeviceType } from '../types';
import { audioManager } from '../utils/audio';
import { 
  TARGET_STATION_SPIN, 
  INITIAL_SHIP_SPIN,
  INITIAL_DISTANCE, 
  APPROACH_SPEED, 
  DOCKING_THRESHOLD_DISTANCE, 
  SPIN_MATCH_EPSILON, 
  TILT_MATCH_THRESHOLD, 
  TILT_DRIFT_MULTIPLIER, 
  MAX_DRIFT_RADIUS, 
  STABILIZATION_DECEL, 
  MISSION_TIME, 
  STABILIZATION_TARGET_RAD 
} from '../constants';

interface GameProps {
  onFinish: (success: boolean) => void;
  onDocking: () => void;
  onReset: () => void;
  isPaused: boolean;
  status: GameState;
  deviceType: DeviceType;
  externalRotationDelta: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  color: string;
  hasHalo: boolean;
  layer: number; // 0: far, 1: mid, 2: near
}

interface Nebula {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

const Game: React.FC<GameProps> = ({ 
  onFinish, 
  onDocking, 
  onReset, 
  isPaused, 
  status, 
  deviceType,
  externalRotationDelta
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = deviceType === DeviceType.MOBILE;
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  
  const stateRef = useRef({
    stationRotation: 0,
    currentStationSpin: TARGET_STATION_SPIN,
    shipRotation: 0,
    shipRotationSpeed: INITIAL_SHIP_SPIN, 
    distance: INITIAL_DISTANCE,
    tilt: { beta: 0, gamma: 0 },
    lastUpdate: 0,
    isFinished: false,
    dockingProgress: 0,
    isMouseDown: false,
    lastMouseX: 0,
    lastTouchX: 0,
    gameStartTime: 0,
    timeLeft: MISSION_TIME,
    failureReason: '',
    syncTimer: 0,
    activeThrust: 0,
    wasSync: false,
    wasAligned: false,
    lastProximityBeep: 0
  });

  const [uiState, setUiState] = useState({
    shipSpin: INITIAL_SHIP_SPIN,
    targetSpin: TARGET_STATION_SPIN,
    distance: INITIAL_DISTANCE,
    tiltX: 0,
    tiltY: 0,
    timeLeft: MISSION_TIME,
    failureReason: ''
  });

  useEffect(() => {
    audioManager.init();
    if (status === GameState.PLAYING || status === GameState.STABILIZING) {
      audioManager.playMusic(); 
    }

    const stars: Star[] = [];
    const nebulae: Nebula[] = [];
    const worldSize = Math.max(window.innerWidth, window.innerHeight) * 3;
    
    const nebulaColors = ['rgba(30, 58, 138, 0.1)', 'rgba(88, 28, 135, 0.1)', 'rgba(15, 23, 42, 0.15)'];
    for (let i = 0; i < 8; i++) {
      nebulae.push({
        x: (Math.random() - 0.5) * worldSize,
        y: (Math.random() - 0.5) * worldSize,
        size: 400 + Math.random() * 800,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        opacity: 0.2 + Math.random() * 0.3
      });
    }
    nebulaeRef.current = nebulae;

    const starColors = ['#ffffff', '#fff4ea', '#f8f7ff', '#cad8ff', '#fff5f2'];
    const createStar = (x: number, y: number, layer: number) => {
      const sizeBase = Math.random();
      let size = 0.5;
      let brightness = 0.3;
      let hasHalo = false;
      if (layer === 0) { size = 0.3 + Math.random() * 0.5; brightness = 0.2 + Math.random() * 0.4; }
      else if (layer === 1) { size = 0.8 + Math.random() * 1.2; brightness = 0.5 + Math.random() * 0.5; }
      else { size = 1.8 + Math.random() * 2.2; brightness = 0.8 + Math.random() * 0.2; hasHalo = sizeBase > 0.8; }
      return { x, y, size, brightness, color: starColors[Math.floor(Math.random() * starColors.length)], hasHalo, layer };
    };

    for (let i = 0; i < 2500; i++) {
      const r = Math.sqrt(Math.random()) * worldSize;
      const theta = Math.random() * Math.PI * 2;
      const layer = Math.random() > 0.9 ? 2 : (Math.random() > 0.6 ? 1 : 0);
      stars.push(createStar(Math.cos(theta) * r, Math.sin(theta) * r, layer));
    }
    for (let c = 0; c < 6; c++) {
      const cx = (Math.random() - 0.5) * worldSize;
      const cy = (Math.random() - 0.5) * worldSize;
      for (let i = 0; i < 150; i++) {
        const r = Math.pow(Math.random(), 2) * 300;
        const theta = Math.random() * Math.PI * 2;
        stars.push(createStar(cx + Math.cos(theta) * r, cy + Math.sin(theta) * r, 0));
      }
    }
    starsRef.current = stars;

    return () => { audioManager.stopAll(); };
  }, [status]);

  useEffect(() => {
    if (status === GameState.PLAYING) {
      stateRef.current.shipRotationSpeed += externalRotationDelta;
    } else if (status === GameState.STABILIZING) {
      stateRef.current.currentStationSpin -= externalRotationDelta;
    }
  }, [externalRotationDelta, status]);

  // Orientation and Touch Controls for Mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      stateRef.current.tilt = { beta: e.beta || 0, gamma: e.gamma || 0 };
    };

    const handleTouchStart = (e: TouchEvent) => {
      audioManager.resume();
      stateRef.current.lastTouchX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (status === GameState.SUCCESS || status === GameState.FAILED) return;
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - stateRef.current.lastTouchX;
      
      const multiplier = status === GameState.STABILIZING ? -0.001 : 0.001; 
      
      if (status === GameState.STABILIZING) {
        stateRef.current.currentStationSpin += deltaX * multiplier;
      } else {
        stateRef.current.shipRotationSpeed += deltaX * multiplier;
      }
      
      stateRef.current.lastTouchX = currentX;
      if (e.cancelable) e.preventDefault();
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, status]);

  // Mouse Controls for Computer
  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (status === GameState.SUCCESS || status === GameState.FAILED) return;
      audioManager.resume();
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      
      if (status === GameState.PLAYING) {
        stateRef.current.tilt = { beta: ny * 60, gamma: nx * 60 };
      }
      
      if (stateRef.current.isMouseDown) {
        const deltaX = e.clientX - stateRef.current.lastMouseX;
        const multiplier = status === GameState.STABILIZING ? -0.002 : 0.002; 
        if (status === GameState.STABILIZING) {
          stateRef.current.currentStationSpin += deltaX * multiplier;
        } else {
          stateRef.current.shipRotationSpeed += deltaX * multiplier;
        }
        stateRef.current.lastMouseX = e.clientX;
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.isMouseDown = true;
      stateRef.current.lastMouseX = e.clientX;
      audioManager.resume();
    };
    const handleMouseUp = () => {
      stateRef.current.isMouseDown = false;
    };
    const handleWheel = (e: WheelEvent) => {
      if (status === GameState.SUCCESS || status === GameState.FAILED) return;
      audioManager.resume();
      const multiplier = status === GameState.STABILIZING ? 0.0002 : -0.0002; 
      const delta = e.deltaY * multiplier;
      if (status === GameState.STABILIZING) {
        stateRef.current.currentStationSpin -= delta;
      } else {
        stateRef.current.shipRotationSpeed += delta;
      }
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isMobile, status]);

  const drawThruster = (ctx: CanvasRenderingContext2D, x: number, y: number, power: number, direction: number) => {
    if (power <= 0.05) return;
    const flicker = 0.8 + Math.random() * 0.4;
    const length = power * 60 * flicker;
    const width = 6 + power * 15;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, direction);
    ctx.shadowBlur = 15 * power;
    ctx.shadowColor = 'rgba(96, 165, 250, 0.8)';
    const grad = ctx.createLinearGradient(0, 0, 0, length);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(96, 165, 250, 1)');
    grad.addColorStop(1, 'rgba(30, 58, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-width / 2, 0);
    ctx.quadraticCurveTo(0, length * 1.2, width / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      const { current: state } = stateRef;
      if (!state.gameStartTime) state.gameStartTime = time;

      let rawThrust = Math.abs(externalRotationDelta) * 50; 
      if (state.isMouseDown || (isMobile && state.lastTouchX !== 0)) rawThrust += 0.5;
      state.activeThrust = state.activeThrust * 0.9 + Math.min(1.0, rawThrust) * 0.1;

      if (status === GameState.PLAYING) {
        state.stationRotation += state.currentStationSpin;
        state.shipRotation += state.shipRotationSpeed;
        state.distance -= APPROACH_SPEED;
        
        audioManager.updateBuzz(state.shipRotationSpeed);
        audioManager.updateTension(state.distance / INITIAL_DISTANCE);
        
        if (state.distance < 800) {
          const proximityIntensity = 1 - (state.distance / 800);
          const beepInterval = 1000 - (proximityIntensity * 900);
          if (time - state.lastProximityBeep > beepInterval) {
            audioManager.playProximityAlert(proximityIntensity);
            state.lastProximityBeep = time;
          }
        }
        
        const driftX = state.tilt.gamma * TILT_DRIFT_MULTIPLIER;
        const driftY = state.tilt.beta * TILT_DRIFT_MULTIPLIER;
        if (Math.sqrt(driftX * driftX + driftY * driftY) > MAX_DRIFT_RADIUS) {
          state.isFinished = true;
          state.failureReason = 'Boundary';
          audioManager.playFailure();
          onFinish(false);
          return;
        }
        
        const spinDiff = Math.abs(state.shipRotationSpeed - state.currentStationSpin);
        const spinMatch = spinDiff < SPIN_MATCH_EPSILON;
        const tiltSeverity = Math.sqrt(state.tilt.beta ** 2 + state.tilt.gamma ** 2);
        const tiltMatch = tiltSeverity < TILT_MATCH_THRESHOLD;
        
        if (spinMatch && !state.wasSync) audioManager.playSyncAchieved();
        state.wasSync = spinMatch;
        if (tiltMatch && !state.wasAligned) audioManager.playAlignmentAchieved();
        state.wasAligned = tiltMatch;
        
        if (state.distance <= DOCKING_THRESHOLD_DISTANCE) {
          if (spinMatch && tiltMatch) {
            onDocking(); 
          } else {
            state.isFinished = true;
            state.failureReason = 'Collision';
            audioManager.playFailure();
            onFinish(false);
            return;
          }
        }
      } else if (status === GameState.DOCKING) {
        state.currentStationSpin *= STABILIZATION_DECEL;
        state.shipRotationSpeed = state.currentStationSpin;
        state.stationRotation += state.currentStationSpin;
        state.shipRotation = state.stationRotation;
        state.distance = Math.max(0, state.distance - 0.5);
        if (state.distance <= 0) onFinish(false);
      } else if (status === GameState.STABILIZING) {
        state.shipRotationSpeed = state.currentStationSpin;
        state.stationRotation += state.currentStationSpin;
        state.shipRotation = state.stationRotation;
        state.distance = 0;
        const diff = Math.abs(state.currentStationSpin - STABILIZATION_TARGET_RAD);
        if (diff < 0.005) {
          state.syncTimer += 1;
          if (state.syncTimer > 120) { 
            audioManager.playSuccess();
            onFinish(true);
          }
        } else state.syncTimer = 0;
      }

      if (time - state.lastUpdate > 50) {
        setUiState({
          shipSpin: status === GameState.STABILIZING ? state.currentStationSpin : state.shipRotationSpeed,
          targetSpin: status === GameState.STABILIZING ? STABILIZATION_TARGET_RAD : state.currentStationSpin,
          distance: state.distance,
          tiltX: state.tilt.beta,
          tiltY: state.tilt.gamma,
          timeLeft: MISSION_TIME, 
          failureReason: state.failureReason
        });
        state.lastUpdate = time;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const currentSpin = status === GameState.STABILIZING ? state.currentStationSpin : state.shipRotationSpeed;
      
      const shakeMag = 0.2 + (Math.abs(currentSpin) * 12);
      const shakeX = (Math.random() - 0.5) * shakeMag;
      const shakeY = (Math.random() - 0.5) * shakeMag;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      
      const worldRotation = -state.shipRotation;

      ctx.save();
      ctx.translate(cx + shakeX, cy + shakeY);
      ctx.rotate(worldRotation);

      nebulaeRef.current.forEach(neb => {
        const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.size);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = neb.opacity;
        ctx.beginPath(); ctx.arc(neb.x, neb.y, neb.size, 0, Math.PI * 2); ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.beginPath();
      starsRef.current.filter(s => s.layer === 0).forEach(s => {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.brightness * 0.5;
        ctx.moveTo(s.x, s.y);
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      });
      ctx.fill();

      ctx.beginPath();
      starsRef.current.filter(s => s.layer === 1).forEach(s => {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.brightness * 0.8;
        ctx.moveTo(s.x, s.y);
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      });
      ctx.fill();

      starsRef.current.filter(s => s.layer === 2).forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.brightness;
        if (s.hasHalo) {
          ctx.shadowBlur = 12 + Math.random() * 6;
          ctx.shadowColor = s.color;
        }
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      const viewScale = Math.max(0.1, (INITIAL_DISTANCE - state.distance) / INITIAL_DISTANCE * 2.5 + 0.4);
      const driftX = state.tilt.gamma * TILT_DRIFT_MULTIPLIER;
      const driftY = state.tilt.beta * TILT_DRIFT_MULTIPLIER;

      ctx.save();
      ctx.translate(cx - driftX + shakeX, cy - driftY + shakeY);
      ctx.rotate(state.stationRotation + worldRotation);
      ctx.scale(viewScale, viewScale);
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, 0); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#111';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        ctx.save(); ctx.rotate((Math.PI * 2) / 12 * i);
        ctx.fillStyle = i % 3 === 0 ? '#444' : '#aaa';
        ctx.fillRect(140, -15, 20, 30);
        ctx.restore();
      }
      ctx.fillStyle = '#900';
      ctx.beginPath(); ctx.arc(45, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx + shakeX, cy + shakeY);
      const shipScale = Math.min(1.0, viewScale);
      ctx.scale(shipScale, shipScale);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); 
      ctx.moveTo(-40, 0); ctx.lineTo(-10, 0); ctx.moveTo(40, 0); ctx.lineTo(10, 0);
      ctx.moveTo(0, -40); ctx.lineTo(0, -10); ctx.moveTo(0, 40); ctx.lineTo(0, 10);
      ctx.stroke();
      if (status === GameState.PLAYING || status === GameState.STABILIZING) {
        if (state.activeThrust > 0.01) {
          if (state.shipRotationSpeed > 0) {
            drawThruster(ctx, -28, -15, state.activeThrust, -1);
            drawThruster(ctx, 24, 15, state.activeThrust, 1);
          } else {
            drawThruster(ctx, 24, -15, state.activeThrust, -1);
            drawThruster(ctx, -28, 15, state.activeThrust, 1);
          }
        }
      }
      ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-35, 5); ctx.lineTo(-45, 15); ctx.lineTo(45, 15); ctx.lineTo(35, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f9fafb';
      ctx.beginPath();
      ctx.moveTo(-20, -18); ctx.lineTo(20, -18); ctx.lineTo(25, 12); ctx.lineTo(-25, 12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [status, onFinish, onDocking, externalRotationDelta, isMobile]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
      <UIOverlay 
        {...uiState} 
        isFinished={status === GameState.SUCCESS || status === GameState.FAILED}
        status={status}
        onRetry={onReset}
      />
    </div>
  );
};

export default Game;
