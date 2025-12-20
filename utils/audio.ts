
export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Background Music
  private bgMusic: HTMLAudioElement | null = null;
  private bgMusicGain: GainNode | null = null;
  private bgMusicSource: MediaElementAudioSourceNode | null = null;

  // Procedural Layers
  private bassOsc: OscillatorNode | null = null;
  private bassGain: GainNode | null = null;
  private tickInterval: number | null = null;

  private isRunning = false;

  init() {
    if (this.ctx) return;
    
    // Initialize AudioContext
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.45;
    this.masterGain.connect(this.ctx.destination);

    // Cinematic Atmos Layer
    this.bgMusic = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c35064e43f.mp3'); 
    this.bgMusic.loop = true;
    
    this.bgMusicGain = this.ctx.createGain();
    this.bgMusicGain.gain.value = 0.5;
    
    this.bgMusicSource = this.ctx.createMediaElementSource(this.bgMusic);
    this.bgMusicSource.connect(this.bgMusicGain);
    this.bgMusicGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMusic() {
    if (this.isRunning || !this.ctx || !this.bgMusic) return;
    this.isRunning = true;
    this.resume();

    // Start BGM
    this.bgMusic.currentTime = 0;
    this.bgMusic.play().catch(e => console.warn("Audio blocked", e));

    const now = this.ctx.currentTime;

    // Sub-bass layer for tactile feel
    this.bassOsc = this.ctx.createOscillator();
    this.bassGain = this.ctx.createGain();
    this.bassOsc.type = 'triangle';
    this.bassOsc.frequency.setValueAtTime(40, now); // Low E
    this.bassGain.gain.setValueAtTime(0, now);
    this.bassGain.gain.linearRampToValueAtTime(0.2, now + 4);
    this.bassOsc.connect(this.bassGain);
    this.bassGain.connect(this.masterGain!);
    this.bassOsc.start();

    // Mission Ticking (1.25s)
    this.startTicking();
  }

  private startTicking() {
    const playTick = () => {
      if (!this.ctx || !this.isRunning) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      g.gain.setValueAtTime(0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.01);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    };

    this.tickInterval = window.setInterval(playTick, 1250);
  }

  updateBuzz(speed: number) {
    if (!this.ctx || !this.isRunning) return;
    const intensity = Math.min(1, Math.abs(speed) * 15);
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.4 + intensity * 0.15, this.ctx.currentTime, 0.1);
    }
  }

  updateTension(distanceRatio: number) {
    if (!this.ctx || !this.bgMusicGain) return;
    const tension = 1 - distanceRatio;
    this.bgMusicGain.gain.setTargetAtTime(0.5 + tension * 0.5, this.ctx.currentTime, 0.5);
  }

  fadeOutMusic(duration: number = 4) {
    if (!this.ctx || !this.bgMusicGain || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    this.bgMusicGain.gain.setTargetAtTime(0, now, duration / 5);
    this.masterGain.gain.setTargetAtTime(0, now, duration / 4);
    
    setTimeout(() => {
      this.stopAll();
    }, duration * 1000);
  }

  stopAll() {
    this.isRunning = false;
    if (this.tickInterval) clearInterval(this.tickInterval);
    
    if (this.bgMusic) {
      this.bgMusic.pause();
    }

    if (this.bassOsc) {
      try { this.bassOsc.stop(); } catch(e) {}
    }
    this.bassOsc = null;
  }

  playSyncAchieved() {
    this.playBeep(880, 0.08, 'triangle', 0.2);
  }

  playAlignmentAchieved() {
    this.playBeep(660, 0.1, 'sine', 0.2);
  }

  playProximityAlert(intensity: number) {
    const freq = 400 + intensity * 600;
    this.playBeep(freq, 0.04, 'square', 0.1 * intensity);
  }

  playSuccess() {
    this.fadeOutMusic(5);
    this.playBeep(523, 0.5, 'sine', 0.4); 
    setTimeout(() => this.playBeep(659, 0.5, 'sine', 0.3), 150);
  }

  playFailure() {
    this.stopAll();
    this.playBeep(40, 1.5, 'sawtooth', 0.9);
  }

  private playBeep(freq: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

export const audioManager = new SoundManager();
