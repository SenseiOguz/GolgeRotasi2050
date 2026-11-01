import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const events = vi.hoisted(() => ({ mute: (payload: { muted: boolean }): void => { void payload; } }));
vi.mock('../../src/core/GameEvents', () => ({ onEvent: (_event: string, handler: typeof events.mute) => { events.mute = handler; } }));
let saved: Map<string, string>;
const parameter = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() });
const gains: { gain: ReturnType<typeof parameter>; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
const oscillator = () => ({ type: '', frequency: { value: 0, ...parameter() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), onended: null });
beforeEach(() => {
  vi.resetModules(); gains.length = 0; saved = new Map([['golge-rotasi-ambience-enabled', 'false']]);
  vi.stubGlobal('localStorage', { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) });
  vi.stubGlobal('AudioContext', class {
    currentTime = 10; destination = {}; resume = () => Promise.resolve();
    createGain() { const gain = { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() }; gains.push(gain); return gain; }
    createOscillator = oscillator;
  });
});
afterEach(() => vi.unstubAllGlobals());

test('default volume preserves the original envelope and live volume scales its output', async () => {
  const { sfx } = await import('../../src/assets/sfx');
  expect(sfx.volume).toBe(1); sfx.unlock(); sfx.play('click');
  expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(1, 10);
  expect(gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(.035, 10.01);
  expect(gains[1].connect).toHaveBeenCalledWith(gains[0]);
  sfx.setVolume(.25);
  expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(.25, 10);
  expect(saved.get('golge-rotasi-volume')).toBe('0.25');
});

test('volume survives reload, clamps bounds, and ignores NaN', async () => {
  saved.set('golge-rotasi-volume', '0.4');
  const { sfx } = await import('../../src/assets/sfx'); expect(sfx.volume).toBe(.4);
  sfx.setVolume(5); expect(sfx.volume).toBe(1);
  sfx.setVolume(-2); expect(sfx.volume).toBe(0);
  sfx.setVolume(Number.NaN); expect(sfx.volume).toBe(0);
  vi.resetModules(); expect((await import('../../src/assets/sfx')).sfx.volume).toBe(0);
});

test('mute wins over volume changes, and zero volume never starts audio', async () => {
  const { sfx } = await import('../../src/assets/sfx');
  sfx.unlock(); sfx.setVolume(0); sfx.play('click'); expect(gains).toHaveLength(0);
  sfx.setVolume(.5); sfx.play('click'); events.mute({ muted: true }); sfx.setVolume(1);
  expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
  sfx.play('win'); expect(gains).toHaveLength(2);
  events.mute({ muted: false }); expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(1, 10);
});

test('invalid storage and unavailable WebAudio never stop the game', async () => {
  saved.set('golge-rotasi-volume', 'broken');
  const { sfx } = await import('../../src/assets/sfx'); expect(sfx.volume).toBe(1);
  sfx.unlock();
  vi.stubGlobal('AudioContext', undefined);
  vi.stubGlobal('localStorage', { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('denied'); } });
  expect(() => { sfx.setVolume(.6); sfx.play('click'); events.mute({ muted: true }); }).not.toThrow();
  vi.resetModules(); const fallback = (await import('../../src/assets/sfx')).sfx;
  expect(fallback.volume).toBe(1); expect(() => fallback.play('click')).not.toThrow();
});

test('audio waits for interaction and ambience preferences persist independently', async () => {
  const { sfx } = await import('../../src/assets/sfx');
  sfx.play('click'); sfx.setAmbienceEnabled(true); sfx.setAmbienceVolume(.3);
  expect(gains).toHaveLength(0);
  sfx.setAmbienceEnabled(false); sfx.unlock(); sfx.play('click'); expect(gains).toHaveLength(2);
  sfx.setHeatRatio(732 / 740); expect(sfx.heatRatio).toBe(732 / 740);
  vi.resetModules(); const restored = (await import('../../src/assets/sfx')).sfx;
  expect(restored.ambienceEnabled).toBe(false); expect(restored.ambienceVolume).toBe(.3);
  restored.play('win'); expect(gains).toHaveLength(2);
});
