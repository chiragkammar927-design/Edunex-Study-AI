import confetti from 'canvas-confetti';

export type AlertSoundType = 'zen-bell' | 'marimba' | 'harp' | 'tibetan-bowl' | 'friendly-chime';

// Audio Synthesizer for student feedback & Pomodoro audible alert system
class SoundFX {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Gentle Pomodoro Alert Notifications ---

  /**
   * Zen Bell: Soothing 528 Hz singing bowl bell with natural acoustic harmonic overtones
   */
  playGentleZenBell(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));

      // Fundamental 528 Hz (Solfeggio frequency for calm & clarity)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(baseVol * 0.25, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 2.6);

      // 1st Overtone (1056 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1056, now);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.exponentialRampToValueAtTime(baseVol * 0.09, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 1.9);

      // 2nd Overtone (1584 Hz)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1584, now);

      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.exponentialRampToValueAtTime(baseVol * 0.04, now + 0.02);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now);
      osc3.stop(now + 1.3);
    } catch {
      // AudioContext could be blocked if interaction hasn't occurred
    }
  }

  /**
   * Warm Marimba: Gentle wooden mallet arpeggio chord (D4, F#4, A4, D5)
   */
  playWarmMarimba(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));
      const chord = [293.66, 369.99, 440.0, 587.33]; // D major triad

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.085;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(baseVol * 0.22, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.85);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Harp Ripple: Delicate ascending celestial harp pluck sequence
   */
  playHarpRipple(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));
      const notes = [329.63, 415.3, 493.88, 659.25, 987.77]; // E major pentatonic

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.065;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(baseVol * 0.18, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.95);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Tibetan Singing Bowl: Deep warm tone with natural acoustic acoustic beating
   */
  playTibetanBowl(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));

      // Carrier 1 (216 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(216, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(baseVol * 0.25, now + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 2.9);

      // Carrier 2 with 2Hz beating frequency for signature singing bowl warmth
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(218.5, now);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.exponentialRampToValueAtTime(baseVol * 0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 2.9);

      // Higher harmonic 432 Hz
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(432, now);
      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.exponentialRampToValueAtTime(baseVol * 0.07, now + 0.05);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now);
      osc3.stop(now + 1.9);
    } catch {
      // ignore
    }
  }

  /**
   * Friendly Chime: Crisp two-note ascending bell chime
   */
  playFriendlyChime(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(baseVol * 0.2, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.75);

      // Note 2: C6 (1046.50 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.16);
      gain2.gain.setValueAtTime(0.001, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(baseVol * 0.22, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 1.25);
    } catch {
      // ignore
    }
  }

  /**
   * Break End Notification: Gentle uplifting two-phase transition chime
   */
  playBreakEndChime(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));
      const tones = [523.25, 659.25, 783.99]; // C5, E5, G5 soft rise

      tones.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(baseVol * 0.18, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Dispatches audible notification sound based on sound profile
   */
  playAlertSound(sound: AlertSoundType, volume = 0.5) {
    switch (sound) {
      case 'zen-bell':
        this.playGentleZenBell(volume);
        break;
      case 'marimba':
        this.playWarmMarimba(volume);
        break;
      case 'harp':
        this.playHarpRipple(volume);
        break;
      case 'tibetan-bowl':
        this.playTibetanBowl(volume);
        break;
      case 'friendly-chime':
      default:
        this.playFriendlyChime(volume);
        break;
    }
  }

  // --- General UI Sound Effects ---

  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  playChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }

  playPop() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  playMissionComplete() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {
      // ignore
    }
  }

  // --- Push Notification Chimes ---

  /**
   * Study Block Begins: Uplifting energetic alert chime (A4 - C#5 - E5 - A5)
   */
  playStudyBlockAlert(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));
      const chord = [440, 554.37, 659.25, 880]; // A major triumphant chime

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(baseVol * 0.2, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 1.25);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Flashcard Deck Due: Playful cognitive recall bell alert (E5 - B5 chime)
   */
  playFlashcardDueAlert(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));
      const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(baseVol * 0.22, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 1.0);
      });
    } catch {
      // ignore
    }
  }

  // --- Unique Feature: Synthesized Binaural Focus Audio & Ambient Generator ---
  private binauralNodes: {
    oscL?: OscillatorNode;
    oscR?: OscillatorNode;
    noiseNode?: AudioBufferSourceNode;
    gainNode: GainNode;
  } | null = null;
  private activeBinauralType: 'alpha432' | 'gamma40' | 'ambientRain' | null = null;

  startBinauralFocusTone(type: 'alpha432' | 'gamma40' | 'ambientRain', volume = 0.3) {
    this.stopBinauralFocusTone();
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(Math.max(0.02, Math.min(0.8, volume * 0.3)), now + 1.2);
      masterGain.connect(this.ctx.destination);

      if (type === 'alpha432' || type === 'gamma40') {
        const baseFreq = type === 'alpha432' ? 432 : 400;
        const beatDiff = type === 'alpha432' ? 10 : 40; // 10Hz Alpha (calm retention) or 40Hz Gamma (hyper-focus)

        // Left ear oscillator
        const oscL = this.ctx.createOscillator();
        const pannerL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(baseFreq, now);

        // Right ear oscillator
        const oscR = this.ctx.createOscillator();
        const pannerR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(baseFreq + beatDiff, now);

        if (pannerL && pannerR) {
          pannerL.pan.setValueAtTime(-0.8, now);
          pannerR.pan.setValueAtTime(0.8, now);
          oscL.connect(pannerL);
          pannerL.connect(masterGain);
          oscR.connect(pannerR);
          pannerR.connect(masterGain);
        } else {
          oscL.connect(masterGain);
          oscR.connect(masterGain);
        }

        oscL.start(now);
        oscR.start(now);

        this.binauralNodes = {
          oscL,
          oscR,
          gainNode: masterGain,
        };
      } else if (type === 'ambientRain') {
        // Synthesized pink noise with low-pass filter for cozy study rain
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start(now);

        this.binauralNodes = {
          noiseNode: whiteNoise,
          gainNode: masterGain,
        };
      }

      this.activeBinauralType = type;
    } catch {
      // AudioContext could be blocked if no user gesture yet
    }
  }

  stopBinauralFocusTone() {
    if (this.binauralNodes && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.binauralNodes.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        setTimeout(() => {
          this.binauralNodes?.oscL?.stop();
          this.binauralNodes?.oscR?.stop();
          this.binauralNodes?.noiseNode?.stop();
          this.binauralNodes = null;
        }, 550);
      } catch {
        this.binauralNodes = null;
      }
    }
    this.activeBinauralType = null;
  }

  /**
   * Focus Refocus Pulse: Gentle 432 Hz dual harmonic tone to softly re-anchor attention during flow interruption
   */
  playFocusRefocusPulse(volume = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.01, Math.min(1, volume));

      // Tone 1: 432 Hz
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.6);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(baseVol * 0.22, now + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.7);

      // Tone 2: Harmonic 864 Hz octave shimmer
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(864, now + 0.04);

      gain2.gain.setValueAtTime(0.0001, now + 0.04);
      gain2.gain.linearRampToValueAtTime(baseVol * 0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 1.3);
    } catch {
      // ignore
    }
  }

  isBinauralActive() {
    return this.activeBinauralType !== null;
  }

  getActiveBinauralType() {
    return this.activeBinauralType;
  }
}

export const soundFX = new SoundFX();

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#38bdf8', '#a855f7', '#ec4899', '#10b981'],
    });
  } catch {
    // fallback
  }
}

export function triggerCelebration() {
  soundFX.playMissionComplete();
  triggerConfetti();
}
