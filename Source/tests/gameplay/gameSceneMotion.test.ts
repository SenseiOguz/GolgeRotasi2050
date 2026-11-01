import type Phaser from 'phaser';
import { expect, test, vi } from 'vitest';
import { GameScene } from '../../src/scenes/GameScene';
import { Simulation } from '../../src/gameplay/Simulation';
import { createState } from '../../src/core/rules';
import { LEVELS } from '../../src/core/levels';
import { tileCenter } from '../../src/ui/layout';

vi.mock('phaser', () => ({ default: { Scene: class {} } }));
vi.mock('../../src/core/GameEvents', () => ({
  GameEvent: { SIM_STARTED: 'SIM_STARTED', SIM_STEP: 'SIM_STEP', SIM_FINISHED: 'SIM_FINISHED' },
  emitEvent: vi.fn(), onEvent: vi.fn(), offEvent: vi.fn(),
}));
vi.mock('../../src/assets/pixelManifest', () => ({ PIXEL_ASSETS: [] }));
vi.mock('../../src/gameplay/renderAdapter', () => ({ renderToken: vi.fn(), renderWorldObject: vi.fn() }));
vi.mock('../../src/ui/accessibility', () => ({ accessibleTarget: vi.fn() }));
vi.mock('../../src/assets/sfx', () => ({ sfx: {} }));
vi.mock('../../src/gameplay/fx', () => ({ ripple: vi.fn(), floatingHeat: vi.fn(), finishEffect: vi.fn(), stepFeedback: vi.fn() }));

type Tween = { onUpdate(tween: Phaser.Tweens.Tween): void; onComplete(): void };
function harness(pixel = true) {
  const tweens: Tween[] = [];
  const visual = { move: vi.fn(), update: vi.fn(), idle: vi.fn(), deliver: vi.fn() };
  const marker = { setPosition: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis() };
  const progress = { lineStyle: vi.fn().mockReturnThis(), lineBetween: vi.fn().mockReturnThis() };
  const courier = { ...tileCenter(0, 2), setVisible: vi.fn() };
  const scene = new GameScene();
  Object.assign(scene, {
    state: createState(LEVELS[1]), pixel, courier,
    courierVisual: pixel ? visual : undefined, progressMarker: marker, progress,
    hover: { clear: vi.fn() }, previewText: { setVisible: vi.fn() },
    tweens: { add: (config: Tween) => { tweens.push(config); return { remove: vi.fn() }; } },
    time: { delayedCall: vi.fn() },
    add: { rectangle: () => ({ setDepth: vi.fn().mockReturnThis(), destroy: vi.fn() }) },
  });
  return { scene: scene as unknown as { startRun(): void }, tweens, visual, marker, progress, courier };
}

test('startRun passes motion to play and real step tweens drive the courier and progress marker', () => {
  const play = vi.spyOn(Simulation.prototype, 'play');
  try {
    const h = harness();
    h.scene.startRun();
    expect(play).toHaveBeenCalledTimes(1);
    const motion = play.mock.calls[0][4];
    expect(motion).toEqual({ move: expect.any(Function), update: expect.any(Function), idle: expect.any(Function) });
    expect(h.visual.move).toHaveBeenLastCalledWith(0, 0);
    const start = h.tweens.shift()!;
    start.onUpdate({ progress: .5 } as Phaser.Tweens.Tween);
    expect(h.visual.update).toHaveBeenLastCalledWith(.5);
    expect(h.marker.setPosition).toHaveBeenLastCalledWith(h.courier.x, h.courier.y);
    expect(h.marker.setVisible).toHaveBeenLastCalledWith(true);
    start.onComplete();
    expect(h.visual.idle).toHaveBeenCalledTimes(1);
    expect(h.visual.move).toHaveBeenLastCalledWith(80, 0);
    while (h.tweens.length) {
      const tween = h.tweens.shift()!;
      tween.onUpdate({ progress: 1 } as Phaser.Tweens.Tween);
      tween.onComplete();
    }
    expect(h.visual.move).toHaveBeenCalledWith(0, 80);
    expect(h.visual.idle).toHaveBeenCalledTimes(LEVELS[1].route.length);
    expect(h.visual.deliver).toHaveBeenCalledTimes(1);
    expect(h.progress.lineBetween).toHaveBeenCalledTimes(LEVELS[1].route.length - 1);
  } finally { play.mockRestore(); }
});

test('classic startRun leaves the pixel motion adapter disabled', () => {
  const play = vi.spyOn(Simulation.prototype, 'play');
  try {
    const h = harness(false);
    h.scene.startRun();
    expect(play.mock.calls[0][4]).toBeUndefined();
    expect(h.visual.move).not.toHaveBeenCalled();
    expect(h.marker.setVisible).not.toHaveBeenCalled();
  } finally { play.mockRestore(); }
});
