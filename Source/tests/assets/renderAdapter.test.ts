import type Phaser from 'phaser';
import { expect, it, vi } from 'vitest';
import { renderToken } from '../../src/gameplay/renderAdapter';

vi.mock('phaser', () => ({ default: { GameObjects: { Events: { DESTROY: 'destroy' } } } }));
vi.mock('../../src/assets/pixelManifest', () => ({ PIXEL_ASSETS: [
  { key: 'bldg-a-hot', nativeSize: { width: 40, height: 56 }, anchor: { x: .5, y: 1 } },
  { key: 'courier', nativeSize: { width: 48, height: 48 }, anchor: { x: .5, y: .875 } },
] }));

function harness(loaded: string[] = []) {
  const images: { key: string; size?: number[]; origin?: number[]; position?: number[] }[] = [];
  const container = { add: vi.fn(), once: vi.fn() };
  const graphics = { setName: vi.fn().mockReturnThis(), fillStyle: vi.fn().mockReturnThis(), fillTriangle: vi.fn().mockReturnThis() };
  const scene = {
    registry: { get: () => loaded }, textures: { exists: () => true },
    add: {
      container: () => container, ellipse: vi.fn(), graphics: () => graphics,
      image: (_x: number, _y: number, key: string) => {
        const record: typeof images[number] = { key }; images.push(record);
        return { width: 40, height: 40,
          setDisplaySize(w: number, h: number) { record.size = [w,h]; return this; },
          setOrigin(x: number, y: number) { record.origin = [x,y]; return this; },
          setPosition(x: number, y: number) { record.position = [x,y]; return this; },
        };
      },
    },
  } as unknown as Phaser.Scene;
  return { scene, images };
}

it('draws native building x2 with a tile-bottom anchor and upward overhang', () => {
  const h = harness(['bldg-a-hot']); renderToken(h.scene, 'building', 72, 160, 76);
  expect(h.images).toEqual([{ key: 'bldg-a-hot', size: [80,112], origin: [.5,1], position: [0,40] }]);
});
it('uses the manifest default south courier and foot anchor', () => {
  const h = harness(['courier']); renderToken(h.scene, 'courier', 72, 160, 48);
  expect(h.images).toEqual([{ key: 'courier', size: [96,96], origin: [.5,.875], position: [0,40] }]);
});
it('keeps the procedural/classic size and texture path unchanged', () => {
  const h = harness(); renderToken(h.scene, 'building', 72, 160, 76);
  expect(h.images).toEqual([{ key: 'tile-building', size: [76,76] }]);
});
