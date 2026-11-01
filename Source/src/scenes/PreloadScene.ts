import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/constants';
import { isClassicMode, PIXEL_ASSETS } from '../assets/pixelManifest';
/** Load before Boot generates missing procedural textures. */
export class PreloadScene extends Phaser.Scene {
 constructor() { super('PixelPreload'); }
 preload(): void {
  if (isClassicMode(window.location.search)) return;
  this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => console.warn('[pixel] Asset loading failed; procedural fallback remains available.'));
  for (const asset of PIXEL_ASSETS) {
   if (asset.frameWidth && asset.frameHeight) this.load.spritesheet(asset.key, asset.url, { frameWidth: asset.frameWidth, frameHeight: asset.frameHeight, endFrame: (asset.frames ?? 1) - 1 });
   else this.load.image(asset.key, asset.url);
  }
 }
 create(): void {
  const loaded: string[] = [];
  if (!isClassicMode(window.location.search)) for (const asset of PIXEL_ASSETS) {
   if (this.textures.exists(asset.key)) { this.textures.get(asset.key).setFilter(Phaser.Textures.FilterMode.NEAREST); loaded.push(asset.key); }
  }
  this.registry.set('pixelMode', loaded.length > 0);
  this.registry.set('pixelTextureKeys', loaded);
  this.scene.start(SCENE_KEYS.BOOT);
 }
}

