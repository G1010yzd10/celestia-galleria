// ─── WebAudio synth — every sound is generated, 0 bytes of samples ──────────

export class DoomAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private enabled = true;
  private volume = 0.9;
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
      this.master.gain.value = this.enabled ? this.volume : 0;
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
      this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
  }

  /** v2.0 settings: master volume 0..1 */
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx && this.enabled) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  private startAmbient() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    // seraph pad: A-major add9 cluster of detuned sines through a soft filter
    const g = ctx.createGain();
    g.gain.value = 0.028;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    lp.Q.value = 0.4;
    g.connect(lp).connect(this.master);
    const pad = [110, 164.81, 220, 246.94, 277.18, 329.63];
    for (const f of pad) {
      for (const det of [-1.2, 1.2]) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = det;
        const og = ctx.createGain();
        og.gain.value = 1 / pad.length;
        o.connect(og).connect(g);
        o.start();
        this.ambientNodes.push(o);
      }
    }
    // slow breathing LFO on the filter — the temple inhales
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 420;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    this.ambientNodes.push(lfo);
    // faint angelic shimmer (high air)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const nlp = ctx.createBiquadFilter();
    nlp.type = "bandpass";
    nlp.frequency.value = 2900;
    nlp.Q.value = 0.5;
    const ng = ctx.createGain();
    ng.gain.value = 0.006;
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
    // polished marble click
    this.stepAlt = !this.stepAlt;
    this.noiseBurst(0.05, this.stepAlt ? 260 : 225, 0.1, 3);
    this.blip(this.stepAlt ? 96 : 88, 0.06, "sine", 0.05);
  }

  hover() {
    this.blip(1568, 0.045, "sine", 0.035);
  }

  interact() {
    this.blip(784, 0.09, "sine", 0.08);
    this.blip(1175, 0.09, "sine", 0.06, 0.07);
  }

  /** blessed pickup chime — bell partials */
  pickup() {
    this.blip(1046.5, 0.1, "sine", 0.2);
    this.blip(1318.5, 0.1, "sine", 0.16, 0.08);
    this.blip(1568, 0.16, "sine", 0.18, 0.16);
    this.blip(2093, 0.2, "sine", 0.07, 0.16);
  }

  deny() {
    this.blip(130, 0.16, "triangle", 0.1, 0, 82);
  }

  checkout() {
    // ascending major arpeggio into the light
    const seq = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    seq.forEach((f, i) => this.blip(f, 0.13, "sine", 0.18, i * 0.09));
    this.blip(2093, 0.4, "sine", 0.06, 0.45);
  }

  splash() {
    this.noiseBurst(0.4, 900, 0.1, 0.5);
    this.blip(300, 0.25, "sine", 0.08, 0, 120);
  }

  /** camera shutter — two crisp mechanical ticks */
  shutter() {
    this.noiseBurst(0.03, 3800, 0.16, 2.5);
    this.blip(2400, 0.03, "square", 0.05, 0.05);
    this.noiseBurst(0.04, 2600, 0.1, 2.0);
  }

  /** DAWN BELL — struck-bell partials with long decay */
  bell() {
    const t0 = 0;
    this.blip(587.33, 1.8, "sine", 0.16, t0);
    this.blip(587.33 * 2.76, 1.2, "sine", 0.07, t0);
    this.blip(587.33 * 5.4, 0.7, "sine", 0.03, t0);
    this.blip(880, 2.2, "sine", 0.1, 0.35);
    this.blip(880 * 2.76, 1.1, "sine", 0.04, 0.35);
  }

  /** PRISM TOWER — a slow-breathing chord swell */
  swell() {
    if (!this.ctx || !this.master || !this.enabled) return;
    const ctx = this.ctx;
    for (const f of [220, 277.18, 329.63, 440, 554.37]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
      o.connect(g).connect(this.master);
      o.start(t0);
      o.stop(t0 + 3.4);
    }
  }

  /** taking a seat — a soft marble thud */
  sitThud() {
    this.blip(120, 0.12, "sine", 0.09, 0, 64);
    this.noiseBurst(0.06, 500, 0.05, 1);
  }

  /** picking up a relic — a small airy lift */
  lift() {
    this.blip(520, 0.18, "sine", 0.06, 0, 880);
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
