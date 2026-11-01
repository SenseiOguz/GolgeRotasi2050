import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../src/core/GameEvents', () => ({ onEvent: vi.fn() }));
import { sfx } from '../../src/assets/sfx';

afterEach(() => vi.unstubAllGlobals());

it('continues silently when WebAudio is unavailable', () => {
  vi.stubGlobal('AudioContext', undefined);
  expect(() => sfx.play('click')).not.toThrow();
});
