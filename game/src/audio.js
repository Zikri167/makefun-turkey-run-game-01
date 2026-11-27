// Audio: tiny WebAudio synth. Created only after the first user interaction.
// No audio files, no network — everything is oscillators + noise buffers.
'use strict';
const AudioSys = {
  ctx: null, master: null, musicTimer: null, musicOn: false, step: 0,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, lowpass) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    // Deterministic pseudo-noise (fixed-seed LCG) — no Math.random anywhere.
    let s = 0x12345678;
    for (let i = 0; i < len; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = (s / 4294967296 * 2 - 1) * (1 - i / len); }
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass || 900;
    const g = this.ctx.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  },
  jump() { this.tone(320, 0.16, 'square', 0.16, 640); },
  coin() { this.tone(880, 0.09, 'sine', 0.22); setTimeout(() => this.tone(1318, 0.14, 'sine', 0.22), 70); },
  drum() { [660, 880, 1100].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.22), i * 60)); },
  crash() { this.noise(0.25, 0.5, 700); this.tone(140, 0.3, 'sawtooth', 0.25, 60); },
  caught() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.25), i * 160)); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.25), i * 130)); },
  startMusic() {
    if (!this.ctx || this.musicOn) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.musicOn = true;
    // Cheerful little loop: C – F – G – C folk bounce, one note per 0.22s.
    const seq = [262, 330, 392, 523, 392, 330, 349, 440, 523, 440, 392, 330, 294, 392, 494, 587];
    const tick = () => {
      if (!this.musicOn || !this.ctx) return;
      const f = seq[this.step % seq.length]; this.step++;
      this.tone(f, 0.2, 'triangle', 0.07);
      if (this.step % 4 === 1) this.tone(f / 2, 0.22, 'sine', 0.08);
    };
    this.musicTimer = setInterval(tick, 220);
  },
  stopMusic() { this.musicOn = false; if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; } },
};
