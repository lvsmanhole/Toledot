// Ambient sound, synthesized in the browser (no recordings): a low drone, a high shimmer for light,
// wind, running water, birdsong, and fire. Scenes set target levels 0..1 each frame; the mixer glides.

const LAYERS = ["drone", "shimmer", "wind", "water", "birds", "fire"];

function noiseBuffer(ctx, seconds = 4) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02; // brownish
    data[i] = white * 0.5 + last * 3;
  }
  return buffer;
}

export class Ambience {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.gains = {};
    this.levels = Object.fromEntries(LAYERS.map((k) => [k, 0]));
  }

  async enable() {
    if (!this.ctx) this.build();
    await this.ctx.resume();
    this.enabled = true;
    this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.8);
  }

  disable() {
    if (!this.ctx) return;
    this.enabled = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(ctx.destination);
    const noise = noiseBuffer(ctx);
    const layer = (name) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.master);
      this.gains[name] = g;
      return g;
    };
    const loopNoise = () => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      src.loopStart = Math.random();
      src.start(0, Math.random() * 3);
      return src;
    };

    // drone: two detuned low tones through a slowly breathing lowpass
    {
      const out = layer("drone");
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 220;
      filter.connect(out);
      for (const [f, type, gain] of [[55, "sawtooth", 0.05], [55.4, "triangle", 0.18], [82.4, "sine", 0.12], [27.5, "sine", 0.25]]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = gain;
        o.connect(g).connect(filter);
        o.start();
      }
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 90;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
    }
    // shimmer: high partials with slow tremolo
    {
      const out = layer("shimmer");
      for (const [f, rate] of [[880, 0.13], [1318.5, 0.09], [1760, 0.17], [2637, 0.07]]) {
        const o = ctx.createOscillator();
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.015;
        const trem = ctx.createOscillator();
        trem.frequency.value = rate;
        const tg = ctx.createGain();
        tg.gain.value = 0.012;
        trem.connect(tg).connect(g.gain);
        o.connect(g).connect(out);
        o.start();
        trem.start();
      }
    }
    // wind: band-passed noise with a wandering centre
    {
      const out = layer("wind");
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 500;
      bp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      loopNoise().connect(bp).connect(g).connect(out);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lg = ctx.createGain();
      lg.gain.value = 300;
      lfo.connect(lg).connect(bp.frequency);
      lfo.start();
      const gust = ctx.createOscillator();
      gust.frequency.value = 0.07;
      const gg = ctx.createGain();
      gg.gain.value = 0.3;
      gust.connect(gg).connect(g.gain);
      gust.start();
    }
    // water: low-passed noise with fast flutter
    {
      const out = layer("water");
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 180;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      loopNoise().connect(hp).connect(lp).connect(g).connect(out);
      const flutter = ctx.createOscillator();
      flutter.frequency.value = 5.3;
      const fg = ctx.createGain();
      fg.gain.value = 0.12;
      flutter.connect(fg).connect(g.gain);
      flutter.start();
    }
    // fire: crackle from bright noise with random gain spikes, scheduled
    {
      const out = layer("fire");
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1600;
      bp.Q.value = 0.6;
      const roar = ctx.createBiquadFilter();
      roar.type = "lowpass";
      roar.frequency.value = 300;
      const crackle = ctx.createGain();
      crackle.gain.value = 0;
      const rg = ctx.createGain();
      rg.gain.value = 0.6;
      loopNoise().connect(bp).connect(crackle).connect(out);
      loopNoise().connect(roar).connect(rg).connect(out);
      this.crackle = crackle;
    }
    this.birdsOut = layer("birds");
    this.nextChirp = 0;
    this.nextCrackle = 0;
  }

  chirp(t) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const base = 2600 + Math.random() * 1800;
    const notes = 2 + Math.floor(Math.random() * 4);
    g.gain.value = 0;
    for (let i = 0; i < notes; i++) {
      const s = t + i * 0.11;
      o.frequency.setValueAtTime(base, s);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), s + 0.07);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.05, s + 0.015);
      g.gain.linearRampToValueAtTime(0, s + 0.09);
    }
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    o.connect(g).connect(pan).connect(this.birdsOut);
    o.start(t);
    o.stop(t + notes * 0.11 + 0.1);
  }

  /** Called every frame with target levels from the active scene (missing layers fall to zero). */
  update(levels) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    for (const name of LAYERS) {
      const v = Math.max(0, Math.min(1, levels[name] ?? 0));
      if (Math.abs(v - this.levels[name]) > 0.01) {
        this.levels[name] = v;
        this.gains[name].gain.setTargetAtTime(v * v, now, 0.6);
      }
    }
    if (this.levels.birds > 0.05 && now > this.nextChirp) {
      this.chirp(now + 0.05);
      this.nextChirp = now + 0.6 + Math.random() * (3 / this.levels.birds);
    }
    if (this.levels.fire > 0.05 && now > this.nextCrackle) {
      const c = this.crackle.gain;
      c.setValueAtTime(0.9 * Math.random(), now);
      c.setTargetAtTime(0, now + 0.01, 0.03);
      this.nextCrackle = now + Math.random() * 0.12;
    }
  }
}
