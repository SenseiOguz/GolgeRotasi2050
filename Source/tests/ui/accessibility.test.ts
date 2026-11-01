import EventEmitter from 'eventemitter3';
import { afterEach, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({ default: {
  Scenes: { Events: { POST_UPDATE: 'postupdate', SHUTDOWN: 'shutdown' } },
  GameObjects: { Container: class {}, Events: { DESTROY: 'destroy' } },
} }));
vi.mock('../../src/ui/pixel', () => ({ pixelMode: () => true }));
import { accessibleTarget } from '../../src/ui/accessibility';

afterEach(() => vi.unstubAllGlobals());

test('disposing a focused canvas target removes blur handlers before removing its DOM node', () => {
  const events = new EventEmitter();
  const owner = Object.assign(new EventEmitter(), {
    depth: 0, visible: true, parentContainer: null,
    getWorldTransformMatrix: () => ({ scaleX: 1, scaleY: 1, transformPoint: (x: number, y: number) => ({ x, y }) }),
  });
  const blur = vi.fn(() => { throw new Error('Destroyed skin accessed'); });
  const element = {
    classList: { add: vi.fn() }, addEventListener: vi.fn(), style: {}, tagName: 'BUTTON',
    onblur: blur, onfocus: vi.fn(), onpointerleave: vi.fn(),
    remove: vi.fn(function (this: { onblur?: (() => void) | null }) { this.onblur?.(); }),
  };
  const scene = {
    events, sys: { isActive: () => true, settings: { key: 'MenuScene' } }, children: { list: [] },
    game: { canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }) } },
    scale: { gameSize: { width: 1280, height: 720 } },
  };
  vi.stubGlobal('document', { body: { append: vi.fn() } });
  accessibleTarget(scene as unknown as Phaser.Scene, owner as unknown as Parameters<typeof accessibleTarget>[1], element as unknown as HTMLElement, { x: 100, y: 200, width: 400, height: 44 });
  expect(element.style).toMatchObject({ left: '150px', top: '300px', width: '600px', height: '66px' });
  expect(() => owner.emit('destroy')).not.toThrow();
  expect(blur).not.toHaveBeenCalled();
  expect(element.remove).toHaveBeenCalledOnce();
  expect(events.listenerCount('postupdate')).toBe(0);
  expect(events.listenerCount('shutdown')).toBe(0);
});
