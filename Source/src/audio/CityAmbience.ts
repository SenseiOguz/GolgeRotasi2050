/** One app-owned loop. Stop disconnects its nodes and clears its only timer. */
export class CityAmbience {
  private bus?: GainNode;
  private filter?: BiquadFilterNode;
  private noise?: AudioBufferSourceNode;
  private timer?: ReturnType<typeof setTimeout>;
  private birds = new Set<OscillatorNode>();
  private running = false;
  constructor(private context: AudioContext, private output: GainNode, private level: number, private heatRatio: number) {}
  start(): boolean {
    if (this.running) return true;
    try {
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
      const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = this.context.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true;
      this.filter = this.context.createBiquadFilter(); this.filter.type = 'lowpass';
      this.bus = this.context.createGain(); this.bus.gain.setValueAtTime(0, this.context.currentTime);
      this.noise.connect(this.filter); this.filter.connect(this.bus); this.bus.connect(this.output);
      this.running = true; this.update(this.level, this.heatRatio); this.noise.start(); this.schedule(); return true;
    } catch { this.stop(); return false; }
  }
  update(level: number, heatRatio: number): void {
    this.level = level; this.heatRatio = heatRatio;
    try {
      const heat = Math.min(1, Math.max(0, heatRatio / 1.5)), now = this.context.currentTime;
      this.bus?.gain.setTargetAtTime(level * .05 * (.55 + heat * .45), now, .3);
      this.filter?.frequency.setTargetAtTime(450 + heat * 1000, now, .5);
    } catch { /* Ambient sound is optional. */ }
  }
  private schedule(): void {
    this.timer = setTimeout(() => {
      if (!this.running) return;
      try {
        const hot = this.heatRatio > 1, now = this.context.currentTime;
        const bird = this.context.createOscillator(), gain = this.context.createGain();
        bird.type = hot ? 'triangle' : 'sine'; bird.frequency.setValueAtTime(hot ? 2800 : 1600, now); bird.frequency.exponentialRampToValueAtTime(hot ? 3100 : 2450, now + .09); bird.frequency.exponentialRampToValueAtTime(hot ? 2700 : 1750, now + .22);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(hot ? .06 : .12, now + .025); gain.gain.linearRampToValueAtTime(0, now + .25);
        bird.connect(gain); gain.connect(this.bus!); this.birds.add(bird);
        bird.onended = () => { this.birds.delete(bird); bird.disconnect(); gain.disconnect(); }; bird.start(now); bird.stop(now + .26);
      } catch { /* Missing WebAudio features remain silent. */ }
      this.schedule();
    }, 4000 + Math.random() * (this.heatRatio > 1 ? 2500 : 5000));
  }
  stop(): void {
    this.running = false; if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined;
    try { this.noise?.stop(); } catch { /* Already stopped. */ }
    for (const bird of this.birds) { try { bird.stop(); } catch { /* Already ended. */ } }
    this.birds.clear();
    try { this.noise?.disconnect(); this.filter?.disconnect(); this.bus?.disconnect(); } catch { /* Optional cleanup. */ }
    this.noise = undefined; this.filter = undefined; this.bus = undefined;
  }
}
