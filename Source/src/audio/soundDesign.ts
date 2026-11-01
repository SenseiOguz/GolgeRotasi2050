export type Sound = 'click' | 'hover' | 'place' | 'tree' | 'canopy' | 'coolRoof' | 'step' | 'reject' | 'win' | 'lose' | 'star';
export interface Tone { frequency: number; end?: number; duration: number; delay?: number; gain: number; wave?: OscillatorType | 'noise' }
export const SOUND_CUES: Record<Sound, readonly Tone[]> = {
  star: [{ frequency: 1040, end: 1320, duration: .12, gain: .006 }],
  click: [{ frequency: 480, duration: .13, gain: .035 }],
  hover: [{ frequency: 680, end: 740, duration: .055, gain: .006 }],
  place: [{ frequency: 420, duration: .13, gain: .025 }, { frequency: 640, delay: .1, duration: .13, gain: .02 }],
  tree: [{ frequency: 1100, end: 500, duration: .25, gain: .015, wave: 'noise' }, { frequency: 520, end: 380, duration: .19, gain: .009 }],
  canopy: [{ frequency: 240, end: 160, duration: .055, gain: .022, wave: 'triangle' }, { frequency: 620, end: 820, delay: .055, duration: .16, gain: .012 }],
  coolRoof: [{ frequency: 880, duration: .24, gain: .018 }, { frequency: 1320, delay: .065, duration: .25, gain: .013 }, { frequency: 1760, delay: .13, duration: .28, gain: .008 }],
  step: [{ frequency: 110, end: 65, duration: .045, gain: .003, wave: 'triangle' }],
  reject: [{ frequency: 180, duration: .12, gain: .025, wave: 'triangle' }, { frequency: 130, delay: .09, duration: .13, gain: .02 }],
  win: [{ frequency: 440, duration: .18, gain: .025 }, { frequency: 550, delay: .12, duration: .18, gain: .025 }, { frequency: 660, delay: .24, duration: .18, gain: .023 }, { frequency: 880, delay: .36, duration: .32, gain: .02 }],
  lose: [{ frequency: 330, end: 290, duration: .2, gain: .023, wave: 'triangle' }, { frequency: 220, delay: .15, duration: .22, gain: .02 }, { frequency: 150, delay: .3, duration: .27, gain: .018 }],
};

export function playCue(context: AudioContext, output: GainNode, sound: Sound, active: Set<GainNode>): void {
  for (const tone of SOUND_CUES[sound]) {
    const gain = context.createGain(), time = context.currentTime + (tone.delay ?? 0);
    let source: OscillatorNode | AudioBufferSourceNode;
    let filter: BiquadFilterNode | undefined;
    if (tone.wave === 'noise') {
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * tone.duration), context.sampleRate);
      const samples = buffer.getChannelData(0); for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const noise = context.createBufferSource(); noise.buffer = buffer; source = noise;
      filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(tone.frequency, time); filter.frequency.linearRampToValueAtTime(tone.end ?? tone.frequency, time + tone.duration);
      source.connect(filter); filter.connect(gain);
    } else {
      const oscillator = context.createOscillator(); oscillator.type = tone.wave ?? 'sine'; oscillator.frequency.setValueAtTime(tone.frequency, time);
      if (tone.end) oscillator.frequency.linearRampToValueAtTime(tone.end, time + tone.duration);
      source = oscillator; source.connect(gain);
    }
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(tone.gain, time + Math.min(.01, tone.duration / 4)); gain.gain.exponentialRampToValueAtTime(.0001, time + tone.duration * .9); gain.gain.linearRampToValueAtTime(0, time + tone.duration);
    gain.connect(output); active.add(gain);
    source.onended = () => { active.delete(gain); source.disconnect(); filter?.disconnect(); gain.disconnect(); };
    source.start(time); source.stop(time + tone.duration);
  }
}
