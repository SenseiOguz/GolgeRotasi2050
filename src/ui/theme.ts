import Phaser from 'phaser';
import { PALETTE } from '../core/constants';
import { pixelMode } from './pixel';
import { accessibleText } from './accessibility';
import { PIXEL_FONT_FAMILY } from './numerals';
export const COLORS = { bg: 0x101c2c, panel: 0x1b3044, edge: 0x355266, cool: 0x43c6a5, hot: 0xf87852, text: 0xecf4f6, warn: 0xf0c35c };
export function text(scene: Phaser.Scene, x: number, y: number, value: string, size = 18, width?: number): Phaser.GameObjects.Text {
  const label = scene.add.text(x, y, value, { fontFamily: pixelMode(scene) ? PIXEL_FONT_FAMILY : 'Segoe UI, Arial, sans-serif', fontSize: `${size}px`, color: pixelMode(scene) ? '#1B3044' : PALETTE.TEXT, ...(width ? { wordWrap: { width, useAdvancedWrap: true } } : {}) });
  accessibleText(scene, label);
  return label;
}
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, w, h, COLORS.panel).setOrigin(0).setStrokeStyle(1, COLORS.edge);
}
