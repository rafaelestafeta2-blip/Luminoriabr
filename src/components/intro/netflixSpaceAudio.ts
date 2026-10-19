/**
 * Pure Web Audio API synthesizer for Netflix-style "Ta-Dum" cinematic boom
 * and deep space atmospheric drone. Zero external files (no 404s).
 */

class NetflixSpaceAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playTaDum() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. The Iconic "Ta": Deep low transient punch (strike 1)
    this.createDrumHit(t + 0.05, 95, 38, 0.45, 0.35);

    // 2. The Iconic "DUM": Massive sub-bass cinematic boom with body (strike 2)
    this.createDrumHit(t + 0.38, 120, 28, 0.8, 1.8);

    // 3. Metallic Anvil & Cello Bowed Shimmer (Harmonic Resonance)
    const harmonics = [110, 220, 330, 440, 660, 880];
    harmonics.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.38);

      // Subtle pitch sag
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, t + 2.5);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t + 0.38);
      filter.frequency.exponentialRampToValueAtTime(250, t + 2.8);

      gain.gain.setValueAtTime(0.001, t + 0.38);
      gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + 0.38);
      osc.stop(t + 3.3);
    });

    // 4. Ethereal High Cosmic Chord (Cinema resolution swell)
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chord.forEach((note, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t + 0.6);
      osc.detune.setValueAtTime((i - 1.5) * 8, t + 0.6);

      gain.gain.setValueAtTime(0.001, t + 0.6);
      gain.gain.linearRampToValueAtTime(0.035, t + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + 0.6);
      osc.stop(t + 4.3);
    });
  }

  private createDrumHit(
    time: number,
    startFreq: number,
    endFreq: number,
    gainLevel: number,
    decaySec: number
  ) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decaySec * 0.7);

    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + decaySec + 0.1);
  }

  public dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const netflixSpaceAudio = new NetflixSpaceAudioEngine();
