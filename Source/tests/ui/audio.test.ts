import { afterEach, expect, test, vi } from 'vitest';
import { CityAmbience } from '../../src/audio/CityAmbience';
import { SOUND_CUES } from '../../src/audio/soundDesign';
const param = () => ({ setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), gain: param(), frequency: param(), loop: false, type: '', onended: null, buffer: null });
afterEach(() => vi.useRealTimers());

test('all effects have different signatures and footsteps stay much quieter than clicks', () => {
  expect(new Set(Object.values(SOUND_CUES).map(cue => JSON.stringify(cue))).size).toBe(Object.keys(SOUND_CUES).length);
  expect(SOUND_CUES.step[0].gain).toBeLessThan(SOUND_CUES.click[0].gain / 10);
  expect(SOUND_CUES.step[0].duration).toBeLessThan(.08);
});

test('ambience follows real heat ratio and owns one stoppable loop and timer', () => {
  vi.useFakeTimers(); const noise = node(), filter = node(), bus = node(), output = node();
  const context = { currentTime: 2, sampleRate: 10, createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(20) })), createBufferSource: vi.fn(() => noise), createBiquadFilter: vi.fn(() => filter), createGain: vi.fn(() => bus), createOscillator: vi.fn(node) };
  const loop = new CityAmbience(context as unknown as AudioContext, output as unknown as GainNode, .25, .5);
  expect(loop.start()).toBe(true); expect(loop.start()).toBe(true);
  expect(bus.gain.setValueAtTime).toHaveBeenCalledWith(0, 2);
  expect(context.createBufferSource).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(1);
  loop.update(.2, 1.5); expect(filter.frequency.setTargetAtTime).toHaveBeenLastCalledWith(1450, 2, .5);
  expect(bus.gain.setTargetAtTime.mock.lastCall?.[0]).toBeCloseTo(.01);
  vi.advanceTimersByTime(10000); expect(context.createOscillator).toHaveBeenCalled();
  loop.stop(); expect(noise.stop).toHaveBeenCalledOnce(); expect(noise.disconnect).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
});

test('unsupported ambient audio stays silent and leaves no timer', () => {
  vi.useFakeTimers();
  const loop = new CityAmbience({ createBuffer: () => { throw Error('unsupported'); } } as unknown as AudioContext, {} as GainNode, .25, 1);
  expect(loop.start()).toBe(false); expect(() => loop.stop()).not.toThrow(); expect(vi.getTimerCount()).toBe(0);
});
