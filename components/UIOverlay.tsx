
import React from 'react';
import { GameState } from '../types';
import { TILT_MATCH_THRESHOLD, MAX_DRIFT_RADIUS, TILT_DRIFT_MULTIPLIER, STABILIZATION_TARGET_RPM } from '../constants';

interface UIOverlayProps {
  shipSpin: number;
  targetSpin: number;
  distance: number;
  tiltX: number;
  tiltY: number;
  timeLeft: number;
  isFinished: boolean;
  status: GameState;
  failureReason: string;
  onRetry: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  shipSpin, targetSpin, distance, tiltX, tiltY, timeLeft, isFinished, status, failureReason, onRetry 
}) => {
  const isStabilizing = status === GameState.STABILIZING;
  
  // Calculate how closely the speeds match as a percentage
  const spinDiff = Math.abs(shipSpin - targetSpin);
  const maxPossibleDiff = Math.max(Math.abs(targetSpin), 0.1); // Avoid division by zero
  const spinMatchPercent = Math.max(0, 100 - (spinDiff / maxPossibleDiff) * 100);
  
  const tiltSeverity = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
  const isAligned = tiltSeverity < TILT_MATCH_THRESHOLD;
  const isSync = spinMatchPercent > 92;

  const driftX = tiltY * TILT_DRIFT_MULTIPLIER;
  const driftY = tiltX * TILT_DRIFT_MULTIPLIER;
  const driftDist = Math.sqrt(driftX * driftX + driftY * driftY);
  const driftWarn = driftDist > MAX_DRIFT_RADIUS * 0.7;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-start">
        <div className="space-y-1 bg-black/40 p-2 border-l border-blue-500 backdrop-blur-sm">
          <div className="text-blue-400 text-[10px] uppercase tracking-widest">
            {isStabilizing ? "Target RPM" : "Target Spin"}
          </div>
          <div className="text-xl font-bold">{(targetSpin * 60 * 60 / (2 * Math.PI)).toFixed(1)} <span className="text-xs font-normal opacity-60">RPM</span></div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-center mb-4">
            <div className="text-blue-400 text-[10px] uppercase tracking-widest">
              {isStabilizing ? "Hull Pressure" : "Distance to Port"}
            </div>
            <div className={`text-5xl font-black tabular-nums transition-colors duration-300 ${distance < 100 && !isStabilizing ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {isStabilizing ? "STABLE" : (distance / 10).toFixed(1) + "m"}
            </div>
          </div>
        </div>

        <div className="space-y-1 text-right bg-black/40 p-2 border-r border-blue-500 backdrop-blur-sm">
          <div className="text-blue-400 text-[10px] uppercase tracking-widest">Current Rotation</div>
          <div className="text-xl font-bold">{(shipSpin * 60 * 60 / (2 * Math.PI)).toFixed(1)} <span className="text-xs font-normal opacity-60">RPM</span></div>
        </div>
      </div>

      {/* Alignment Status Cue */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center space-y-3">
        {isSync && status === GameState.PLAYING && (
          <div className="text-blue-400 text-xs font-bold tracking-[0.4em] bg-blue-500/10 px-6 py-1 border border-blue-500/30 rounded uppercase">
            Rotation Synchronized
          </div>
        )}
        {isAligned && status === GameState.PLAYING && (
          <div className="text-green-400 text-xs font-bold tracking-[0.4em] animate-pulse bg-green-500/10 px-6 py-1 border border-green-500/30 rounded uppercase">
            Axial Lock Achieved
          </div>
        )}
        {driftWarn && status === GameState.PLAYING && (
          <div className="text-red-500 text-xs font-bold tracking-widest animate-pulse bg-red-900/40 px-6 py-2 border border-red-500/50 rounded uppercase">
            CRITICAL DRIFT: ABORT BOUNDARY NEAR
          </div>
        )}
        {isStabilizing && (
          <div className="space-y-4">
            <div className="text-orange-400 text-sm font-bold tracking-[0.4em] animate-pulse bg-orange-500/10 px-8 py-2 border border-orange-500/50 rounded uppercase backdrop-blur-md">
              Stabilization Phase: Target {STABILIZATION_TARGET_RPM} RPM
            </div>
            <div className="text-white/60 text-[10px] tracking-widest uppercase">
              Control Law: Inverted Thrust Profile
            </div>
          </div>
        )}
      </div>

      {/* Stabilization Transition Overlay */}
      {status === GameState.DOCKING && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
          <div className="bg-blue-600/20 border border-blue-500/50 px-12 py-6 backdrop-blur-xl rounded-sm">
            <h2 className="text-4xl font-black text-blue-400 animate-pulse tracking-[0.2em]">DOCKING...</h2>
            <p className="text-[10px] text-blue-300 mt-2 tracking-[0.3em] uppercase opacity-70">Engagement Latches Securing</p>
          </div>
        </div>
      )}

      {/* Primary Meters */}
      <div className="flex flex-col items-center gap-6 mb-12">
        {/* Rotation Sync Meter */}
        <div className="text-center space-y-2 group">
          <div className="flex justify-between items-end w-80 px-1">
            <div className={`text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 ${isSync ? 'text-green-400 font-bold' : 'text-blue-400'}`}>
              {isStabilizing ? "STABILIZATION SYNC" : "ROTATION SYNC"}
            </div>
            <div className={`text-xs font-bold tabular-nums ${isSync ? 'text-green-400' : 'text-white'}`}>
              {spinMatchPercent.toFixed(1)}%
            </div>
          </div>
          <div className="w-80 h-4 bg-gray-900/80 rounded-sm overflow-hidden border border-white/20 relative backdrop-blur-sm">
            <div 
              className={`h-full transition-all duration-300 ${isSync ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-blue-600'}`} 
              style={{ width: `${Math.min(100, spinMatchPercent)}%` }}
            />
            {/* Sync Target Line */}
            <div className="absolute inset-y-0 right-[8%] w-0.5 bg-white/40 shadow-[0_0_5px_white]" title="Sync Threshold" />
            
            {/* Locked Indicator Overlay */}
            {isSync && (
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white uppercase tracking-[0.3em] pointer-events-none">
                SYNC LOCKED
              </div>
            )}
          </div>
        </div>

        {/* Alignment Meter (Only during approach) */}
        {!isStabilizing && (
          <div className="text-center space-y-2">
            <div className="flex justify-between items-end w-64 px-1">
              <div className={`text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 ${isAligned ? 'text-green-400 font-bold' : 'text-blue-400'}`}>
                AXIAL ALIGNMENT
              </div>
              <div className={`text-xs font-bold tabular-nums ${isAligned ? 'text-green-400' : 'text-white'}`}>
                {Math.max(0, 100 - (tiltSeverity / (TILT_MATCH_THRESHOLD * 2.5)) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="w-64 h-2 bg-gray-900/80 rounded-sm overflow-hidden border border-white/20 relative backdrop-blur-sm">
               <div 
                className={`h-full transition-all duration-300 ${isAligned ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-600/80'}`} 
                style={{ width: `${Math.max(5, 100 - (tiltSeverity / (TILT_MATCH_THRESHOLD * 3)) * 100)}%` }}
              />
              <div className="absolute inset-y-0 right-[25%] w-px bg-white/30" />
            </div>
          </div>
        )}
      </div>

      {/* Completion Modals */}
      {isFinished && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center pointer-events-auto backdrop-blur-2xl z-50">
          <div className="text-center space-y-10 p-16 border border-white/10 rounded-lg shadow-2xl bg-gradient-to-b from-white/5 to-transparent">
            <div className="space-y-2">
              <h2 className={`text-6xl font-black italic uppercase tracking-tighter ${status === GameState.SUCCESS ? 'text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]'}`}>
                {status === GameState.SUCCESS ? 'MISSION SUCCESS' : 'CRITICAL FAILURE'}
              </h2>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 max-w-md mx-auto leading-relaxed uppercase text-[11px] tracking-[0.25em] font-light">
                {status === GameState.SUCCESS 
                  ? `Station stabilized at ${STABILIZATION_TARGET_RPM} RPM. Endurance mainframe operational. Excellent work, Cooper.` 
                  : failureReason === 'Boundary'
                    ? "Safe approach corridor violated. Navigation lock lost. Mission aborted."
                    : "Hull contact detected during high-speed rotation. Structural integrity compromised."}
              </p>
            </div>

            <button 
              onClick={onRetry}
              className="px-20 py-5 bg-blue-600 text-white font-black uppercase tracking-[0.4em] hover:bg-blue-500 hover:scale-105 transition-all active:scale-95 border-b-4 border-blue-900 shadow-xl"
            >
              Restart Sequence
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
