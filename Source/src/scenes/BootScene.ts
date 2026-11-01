import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/constants';
import { TEXTURE_KEYS as K } from '../assets/textureKeys';
export class BootScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.BOOT); }
  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const generate = (key: string, draw: () => void, size = 80): void => { if (this.textures.exists(key)) return; g.clear(); draw(); g.generateTexture(key, size, size); };
    const ground = (color: number): void => { g.fillStyle(color); g.fillRoundedRect(1, 1, 78, 78, 5); g.lineStyle(1, 0xffffff, .07); g.strokeRoundedRect(2, 2, 76, 76, 4); };
    generate(K.road, () => { ground(0x485766); g.lineStyle(2, 0xd6d1b4, .6); for (let y = 8; y < 80; y += 24) g.lineBetween(40, y, 40, y + 12); });
    generate(K.building, () => { ground(0x46515a); g.fillStyle(0x101c2c, .45); g.fillRect(16, 20, 55, 54); g.fillStyle(0x697981); g.fillRect(10, 10, 54, 52); g.fillStyle(0x98a7a6); g.fillRect(10, 10, 54, 8); g.fillStyle(0x394c5b); for (let x = 20; x < 60; x += 16) for (let y = 28; y < 56; y += 16) g.fillRect(x, y, 8, 7); });
    generate(K.park, () => { ground(0x315d50); g.lineStyle(5, 0xa6ac7d, .6); g.lineBetween(6, 65, 70, 15); g.fillStyle(0x438268); g.fillCircle(23, 23, 14); g.fillCircle(58, 57, 13); });
    generate(K.water, () => { ground(0x28576d); g.lineStyle(2, 0x73b9cb, .5); for (let y = 16; y < 80; y += 19) { g.lineBetween(12, y, 35, y); g.lineBetween(45, y + 5, 68, y + 5); } });
    for (const [key, color, goal] of [[K.start, 0xf0c35c, false], [K.goal, 0x43c6a5, true]] as const) generate(key, () => { ground(0x485766); g.fillStyle(color, .25); g.fillCircle(40, 40, 30); g.lineStyle(3, color); g.strokeCircle(40, 40, 25); g.fillStyle(color); if (goal) { g.fillRect(34, 24, 12, 32); g.fillRect(24, 34, 32, 12); } else g.fillTriangle(29, 22, 29, 58, 58, 40); });
    generate(K.tree, () => { g.fillStyle(0x101c2c, .35); g.fillEllipse(43, 64, 53, 19); g.fillStyle(0x9c7856); g.fillRect(35, 37, 10, 32); g.fillStyle(0x2b9071); g.fillCircle(28, 34, 20); g.fillCircle(49, 35, 22); g.fillStyle(0x43c6a5); g.fillCircle(38, 23, 22); g.fillStyle(0x81deaa); g.fillCircle(31, 17, 8); });
    generate(K.canopy, () => { g.fillStyle(0x101c2c, .4); g.fillEllipse(43, 66, 60, 16); g.fillStyle(0xb8c5c3); g.fillRect(15, 25, 4, 44); g.fillRect(60, 25, 4, 44); g.fillStyle(0xf0c35c); g.fillTriangle(8, 39, 40, 9, 72, 39); g.fillStyle(0xd99b51); g.fillTriangle(8, 39, 72, 39, 40, 49); });
    generate(K.coolRoof, () => { g.fillStyle(0x101c2c, .4); g.fillRect(15, 24, 56, 45); g.fillStyle(0x538b94); g.fillRect(10, 17, 54, 44); g.fillStyle(0xd8eeea); g.fillRect(10, 12, 54, 37); g.lineStyle(2, 0x77bab4); for (let x = 20; x < 60; x += 12) g.lineBetween(x, 18, x, 43); });
    generate(K.courier, () => { g.fillStyle(0x101c2c, .4); g.fillEllipse(41, 64, 32, 12); g.fillStyle(0xecf4f6); g.fillRoundedRect(27, 29, 25, 32, 8); g.fillStyle(0xf87852); g.fillRect(42, 33, 17, 23); g.fillStyle(0xf0c35c); g.fillCircle(39, 23, 12); g.fillStyle(0x263b50); g.fillRect(28, 57, 9, 13); g.fillRect(44, 57, 9, 13); });
    generate(K.panel, () => { g.fillStyle(0x1b3044); g.fillRoundedRect(0, 0, 80, 80, 10); g.lineStyle(1, 0x355266); g.strokeRoundedRect(1, 1, 78, 78, 10); });
    g.destroy(); this.scene.start(SCENE_KEYS.MENU);
  }
}
