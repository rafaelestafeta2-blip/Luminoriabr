/**
 * Pure Web Audio API procedural sound synthesizer for Luminoria Brasil 3D Intro
 * Zero external audio files (no 404s, works offline)
 */

class IntroSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  public startCinematicScore() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Cinematic Deep Sub Bass Drop
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 1.2);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 2.6);

    // 2. Brazilian Jungle Bird Call (Arara-Canindé melodic call)
    this.playMacawCall(now + 0.4);
    this.playMacawCall(now + 2.2);

    // 3. Brazilian Surdo & Percussion Rhythm
    this.playSurdoDrum(now + 0.8, 85);
    this.playSurdoDrum(now + 1.4, 65);
    this.playSurdoDrum(now + 2.0, 85);
    this.playSurdoDrum(now + 2.6, 65);
    this.playSurdoDrum(now + 3.2, 95);

    // 4. Majestic Golden Chord Swell (Emperor cinematic brass & shimmer)
    const chordFreqs = [261.63, 329.63, 392.0, 493.88, 587.33]; // C, E, G, B, D (Cmaj9)
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + 1.0);

      // Shimmer detune
      osc.detune.setValueAtTime((idx - 2) * 6, now + 1.0);

      gain.gain.setValueAtTime(0.001, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.06, now + 2.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 1.0);
      osc.stop(now + 5.6);
    });
  }

  private playMacawCall(startTime: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Characteristic parrot / arara chirp swoop
    osc.frequency.setValueAtTime(1200, startTime);
    osc.frequency.linearRampToValueAtTime(2400, startTime + 0.12);
    osc.frequency.exponentialRampToValueAtTime(1400, startTime + 0.28);
    osc.frequency.linearRampToValueAtTime(2200, startTime + 0.38);
    osc.frequency.exponentialRampToValueAtTime(800, startTime + 0.55);

    // Bandpass filter for authentic bird cry texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, startTime);
    filter.Q.setValueAtTime(4.0, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.58);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.6);
  }

  private playSurdoDrum(time: number, freq: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + 40, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.18);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.42);
  }

  public dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const introAudio = new IntroSoundEngine();
