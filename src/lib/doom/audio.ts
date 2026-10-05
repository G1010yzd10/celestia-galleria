// ─── WebAudio synth — every sound is generated, 0 bytes of samples ──────────

export class DoomAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private enabled = true;
  private started = false;
  private stepAlt = false;

  /** must be called from a user gesture */
  unlock() {
    if (this.started) {
      this.ctx?.resume().catch(() => {});
      return;
    }
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(this.ctx.destination);
      this.started = true;
      this.startAmbient();
    } catch {
      /* audio unavailable */
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
    }
  }

  private startAmbient() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    // deep sector hum: two detuned saws through a lowpass
    const g = ctx.createGain();
    g.gain.value = 0.045;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    g.connect(lp).connect(this.master);
    for (const f of [52, 52.7]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.connect(g);
      o.start();
      this.ambientNodes.push(o);
    }
    // slow breathing LFO on the filter
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 90;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    this.ambientNodes.push(lfo);
    // faint air noise
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const nlp = ctx.createBiquadFilter();
    nlp.type = "bandpass";
    nlp.frequency.value = 800;
    nlp.Q.value = 0.4;
    const ng = ctx.createGain();
    ng.gain.value = 0.012;
    noise.connect(nlp).connect(ng).connect(this.master);
    noise.start();
    this.ambientNodes.push(noise);
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    delay = 0,
    slideTo?: number
  ) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noiseBurst(dur: number, freq: number, vol: number, q = 1.2) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(bp).connect(g).connect(this.master);
    src.start();
  }

  footstep() {
    this.stepAlt = !this.stepAlt;
    this.noiseBurst(0.09, this.stepAlt ? 170 : 150, 0.16, 0.9);
  }

  hover() {
    this.blip(1240, 0.05, "square", 0.05);
  }

  interact() {
    this.blip(660, 0.09, "square", 0.09);
    this.blip(990, 0.09, "square", 0.07, 0.07);
  }

  /** Doom-style item pickup chime */
  pickup() {
    this.blip(523.25, 0.09, "triangle", 0.22);
    this.blip(659.25, 0.09, "triangle", 0.22, 0.08);
    this.blip(783.99, 0.14, "triangle", 0.24, 0.16);
  }

  deny() {
    this.blip(110, 0.16, "sawtooth", 0.14, 0, 70);
  }

  checkout() {
    const seq = [392, 523.25, 659.25, 783.99, 1046.5];
    seq.forEach((f, i) => this.blip(f, 0.12, "triangle", 0.2, i * 0.09));
  }

  splash() {
    this.noiseBurst(0.4, 900, 0.1, 0.5);
    this.blip(300, 0.25, "sine", 0.08, 0, 120);
  }

  dispose() {
    for (const n of this.ambientNodes) {
      try {
        (n as OscillatorNode).stop?.();
      } catch {
        /* already stopped */
      }
    }
    this.ambientNodes = [];
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.started = false;
  }
}
