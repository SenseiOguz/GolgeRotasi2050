import Phaser from 'phaser';
import fontUrl from '../assets/fonts/PixelifySans.ttf?url';
import digitFontUrl from '../assets/fonts/RouteDigits.otf?url';
import manifest from '../../art/ui/manifest.json';
import { DIGIT_UNICODE_RANGE, LETTER_UNICODE_RANGE } from './numerals';

export function pixelMode(scene: Phaser.Scene): boolean {
  return scene.registry.get('pixelMode') === true && scene.textures.exists('ui-panel-9');
}
let fontReady: Promise<void> | undefined;
export function loadPixelFont(): Promise<void> {
  return fontReady ??= (async () => {
    const face = new FontFace('Pixelify Sans', `url(${fontUrl})`, { unicodeRange: LETTER_UNICODE_RANGE, weight: '400 700' });
    document.fonts.add(await face.load());
    const digits = new FontFace('Route Digits', `url(${digitFontUrl})`, { unicodeRange: DIGIT_UNICODE_RANGE });
    document.fonts.add(await digits.load());
  })().catch(() => { /* The system-font fallback keeps the game usable. */ });
}
export function reducedMotion(): boolean {
  try { const value = localStorage.getItem('golge-rotasi-reduced-motion'); if (value !== null) return value === 'true'; } catch { /* Optional storage. */ }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function frame(scene: Phaser.Scene, x: number, y: number, width: number, height: number, key = 'ui-panel-9'): Phaser.GameObjects.NineSlice {
  const asset = manifest.assets.find(asset => asset.key === key);
  const borders = asset && 'nineSlice' in asset ? asset.nineSlice : undefined;
  const b = borders as { left: number; right: number; top: number; bottom: number } | undefined;
  return scene.add.nineslice(x, y, key, undefined, width / 2, height / 2, b?.left ?? 3, b?.right ?? 3, b?.top ?? 3, b?.bottom ?? 3).setScale(2).setOrigin(0);
}
export function icon(scene: Phaser.Scene, x: number, y: number, key: string, size = 40): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setDisplaySize(size, size);
}
