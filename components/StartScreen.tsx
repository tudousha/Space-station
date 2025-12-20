
import React from 'react';
import { DeviceType } from '../types';
import { audioManager } from '../utils/audio';

interface StartScreenProps {
  onStart: (useCamera: boolean) => void;
  deviceType: DeviceType;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, deviceType }) => {
  const isMobile = deviceType === DeviceType.MOBILE;

  const handleStart = (camera: boolean) => {
    audioManager.init();
    audioManager.resume();
    onStart(camera);
  };

  return (
    <div className="max-w-xl w-full p-8 bg-black/80 border border-blue-500/30 rounded-xl backdrop-blur-xl text-center shadow-[0_0_80px_rgba(59,130,246,0.15)] z-50">
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-2 tracking-[0.2em] text-white">ENDURANCE</h1>
        <div className="h-0.5 w-24 bg-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-400 text-xs tracking-[0.3em] uppercase font-bold">Orbital Docking Sequence</p>
      </div>
      
      <p className="text-gray-400 text-sm mb-8 italic">"It's not impossible. It's necessary."</p>
      
      <div className="grid grid-cols-1 gap-4 text-left mb-10">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold">01</div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Rotation Control</h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {isMobile 
              ? "Circular hand gestures via camera OR horizontal touch swipes to adjust RPM." 
              : "Use Mouse Wheel or Click-Drag to sync your rotation with the Endurance."}
          </p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold">02</div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Axial Stability</h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {isMobile 
              ? "Maintain a level device. Physical tilt causes directional drift." 
              : "Mouse position controls orientation. Keep the crosshair locked at the center."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => handleStart(true)}
          className="group relative overflow-hidden w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg transition-all tracking-[0.2em] shadow-lg shadow-blue-900/20"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            USE HAND GESTURE SYNC
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
        </button>
        
        <button 
          onClick={() => handleStart(false)}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-bold rounded-lg transition-all text-[11px] tracking-[0.15em] border border-white/5"
        >
          SKIP CAMERA / USE TOUCH SWIPES
        </button>
      </div>
      
      <p className="mt-6 text-[9px] text-gray-600 uppercase tracking-widest">
        Mission: Endurance Stabilization Protocol // 202 RPM Target
      </p>
    </div>
  );
};

export default StartScreen;
