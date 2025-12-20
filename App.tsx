import React, { useState, useEffect, useCallback, useRef } from 'react';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import CameraOverlay from './components/CameraOverlay';
import { GameState, DeviceType } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [gameId, setGameId] = useState(0);
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.COMPUTER);
  const [rotationDelta, setRotationDelta] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  
  // --- 音频逻辑开始 ---
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 确保你的 mp3 文件已上传到 public 文件夹并命名为 bgm.mp3
    const audio = new Audio('./bgm.mp3'); 
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, []);

  const playMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Music play blocked:", err));
    }
  };
  // --- 音频逻辑结束 ---

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDeviceType(isMobile ? DeviceType.MOBILE : DeviceType.COMPUTER);
  }, []);

  const requestPermissions = async (useCamera: boolean) => {
    // 用户点击开始时，触发音频播放 [cite: 27]
    playMusic(); 

    try {
      if (useCamera) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setCameraEnabled(true);
      }

      if (deviceType === DeviceType.MOBILE) {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            alert("Motion sensor access is required for orientation tracking.");
            return;
          }
        }
      }
      
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error("Initialization failed", err);
      if (useCamera) {
        alert("Camera access failed. Playing with standard controls.");
        setGameState(GameState.PLAYING);
      }
    }
  };

  const handleFinish = (success: boolean) => {
    if (gameState === GameState.DOCKING && !success) {
      setGameState(GameState.STABILIZING);
    } else {
      setGameState(success ? GameState.SUCCESS : GameState.FAILED);
    }
  };

  const handleDockingInitiated = () => {
    setGameState(GameState.DOCKING);
  };

  const resetGame = () => {
    setGameId(prev => prev + 1);
    setGameState(GameState.PLAYING);
  };

  const handleGestureRotation = useCallback((delta: number) => {
    setRotationDelta(delta);
  }, []);

  return (
    <div className="w-full h-screen relative bg-black flex flex-col items-center justify-center overflow-hidden">
      {gameState === GameState.START && (
        <StartScreen 
          onStart={(camera) => requestPermissions(camera)} 
          deviceType={deviceType} 
        />
      )}

      {gameState !== GameState.START && (
        <>
          {cameraEnabled && (
            <CameraOverlay onRotationDelta={handleGestureRotation} />
          )}
          <Game 
            key={gameId}
            deviceType={deviceType}
            externalRotationDelta={rotationDelta}
            onFinish={handleFinish} 
            onDocking={handleDockingInitiated}
            isPaused={gameState === GameState.SUCCESS || gameState === GameState.FAILED}
            onReset={resetGame}
            status={gameState}
          />
        </>
      )}
    </div>
  );
};

export default App;
