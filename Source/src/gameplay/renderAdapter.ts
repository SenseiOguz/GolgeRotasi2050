import Phaser from 'phaser';
import type { TileType, ToolId } from '../core/types';
import { TEXTURE_KEYS } from '../assets/textureKeys';
import { PIXEL_ASSETS } from '../assets/pixelManifest';
import { GRID_LAYOUT } from '../ui/layout';
const colors = { road: 0x526170, building: 0x273d55, park: 0x307263, water: 0x327b9c, start: 0x43c6a5, goal: 0xf0c35c, tree: 0x43c6a5, canopy: 0xf0c35c, coolRoof: 0xecf4f6, courier: 0xffffff };
export function renderToken(scene: Phaser.Scene, kind: TileType | ToolId | 'courier', x: number, y: number, size: number): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const loaded = scene.registry.get('pixelTextureKeys') as string[] | undefined;
  // F1 reference aliases; courier is the manifest's south-facing default.
  const candidates = kind === 'building' ? [TEXTURE_KEYS.building, 'bldg-a-hot']
    : kind === 'coolRoof' ? [TEXTURE_KEYS.coolRoof, 'bldg-a-coolroof']
    : kind === 'courier' ? ['courier_s', TEXTURE_KEYS.courier] : [TEXTURE_KEYS[kind]];
  const pixel = candidates.map(key => PIXEL_ASSETS.find(asset => asset.key === key && loaded?.includes(key) && scene.textures.exists(key))).find(asset => asset !== undefined);
  if (['building', 'tree', 'canopy', 'courier'].includes(kind)) {
    container.add(scene.add.ellipse(4, size * 0.3, size * 0.8, size * 0.25, 0x101c2c, 0.3));
  }
  if (pixel) {
    const image = scene.add.image(0, 0, pixel.key);
    const native = pixel.nativeSize ?? { width: image.width, height: image.height };
    const anchor = pixel.anchor ?? { x: 0.5, y: 0.5 };
    const bottomAligned = ['building', 'tree', 'canopy', 'coolRoof', 'courier'].includes(kind);
    image.setOrigin(anchor.x, anchor.y).setDisplaySize(native.width * 2, native.height * 2);
    image.setPosition((anchor.x - 0.5) * GRID_LAYOUT.tileSize, bottomAligned ? GRID_LAYOUT.tileSize / 2 : (anchor.y - 0.5) * GRID_LAYOUT.tileSize);
    container.add(image);
  } else if (scene.textures.exists(TEXTURE_KEYS[kind])) {
    container.add(scene.add.image(0, 0, TEXTURE_KEYS[kind]).setDisplaySize(size, size));
  } else {
    const graphics = scene.add.graphics();
    graphics.fillStyle(colors[kind]);
    if (kind === 'tree' || kind === 'courier') {
      graphics.fillCircle(0, 0, size * 0.35);
      graphics.lineStyle(3, 0x101c2c).strokeCircle(0, 0, size * 0.35);
      if (kind === 'tree') graphics.fillStyle(0x74513a).fillRect(-3, 5, 6, size * 0.4);
    } else {
      graphics.fillRoundedRect(-size / 2, -size / 2, size, size, 5);
      if (kind === 'building') graphics.fillStyle(0x8294a5).fillRect(-size / 3, -size / 3, size / 2, size / 2);
      if (kind === 'canopy') graphics.lineStyle(3, 0xffffff).lineBetween(-size / 2, 0, size / 2, 0);
    }
    container.add(graphics);
  }
  if (kind === 'courier') {
    const heading = scene.add.graphics().setName('heading');
    heading.fillStyle(0xecf4f6, 0.85).fillTriangle(size * 0.44, -4, size * 0.44, 4, size * 0.57, 0);
    container.add(heading);
  }
  if (kind === 'tree') {
    scene.tweens.add({ targets: container, angle: 1.5, duration: 1600 + (x % 3) * 150, yoyo: true, repeat: -1 });
    container.once(Phaser.GameObjects.Events.DESTROY, () => scene.tweens.killTweensOf(container));
  }
  return container;
}

/** Enhanced world objects use silhouette shadows and bounded tile-bottom overhang.
 * The original renderToken path remains unchanged for classic/MVP and menu callers.
 */
export function renderWorldObject(scene: Phaser.Scene, key: string, kind: TileType | ToolId, x: number, y: number): Phaser.GameObjects.Container {
  const container = scene.add.container(x,y);
  const image = scene.add.image(0,40,key).setOrigin(0.5,1);
  const building = kind === 'building' || kind === 'coolRoof' || kind === 'start' || kind === 'goal';
  const native = PIXEL_ASSETS.find(asset => asset.key === key)?.nativeSize ?? { width: image.width, height: image.height };
  // Cap the full canvas at 48 native px: 40px tile + maximum 8px roof overhang.
  const height = Math.min(native.height * 2, building ? 96 : native.height * 2);
  image.setDisplaySize(native.width * 2,height);
  const shadow = scene.add.image(6,44,key).setOrigin(0.5,1).setDisplaySize(native.width * 2,height).setTintFill(0x0b1320).setAlpha(0.35);
  container.add([shadow,image]);
  return container;
}
