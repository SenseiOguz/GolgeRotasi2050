import type Phaser from 'phaser';
import { reducedMotion } from './pixel';
import { text } from './theme';

/** Fixed object budget: three shadows and six recycled chimney puffs. */
export function addMapAtmosphere(scene: Phaser.Scene): void {
  if (reducedMotion()) return;
  for (let i = 0; i < 3; i++) {
    const shadow = scene.add.ellipse(160 + i * 420, 178 + i * 112, 264, 72, 0x1b3044, .065).setAngle(-12).setName('map-cloud-shadow');
    scene.tweens.add({ targets: shadow, x: shadow.x + 160, y: shadow.y + 20, duration: 24000 + i * 4000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  for (let i = 0; i < 6; i++) {
    const x = i % 2 ? 1200 : 1156, y = i % 2 ? 192 : 148;
    const puff = scene.add.circle(x, y, 5 + i % 3, 0xb7bec0, .22).setName('map-chimney-puff');
    scene.tweens.add({ targets: puff, x: x - 18, y: y - 44, alpha: 0, scale: 2, duration: 3200, delay: Math.floor(i / 2) * 1000, repeat: -1, onRepeat: () => puff.setPosition(x, y).setAlpha(.22).setScale(1) });
  }
}

export function addCurrentGlow(scene: Phaser.Scene, node: Phaser.GameObjects.Container): void {
  const glow = scene.add.circle(0, 0, 42, 0x7fe0b8, .18).setStrokeStyle(2, 0x43c6a5, .5).setName('map-current-glow');
  node.addAt(glow, 0);
  if (!reducedMotion()) scene.tweens.add({ targets: glow, alpha: .5, scale: 1.12, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
}

export function addEarnedStars(scene: Phaser.Scene, node: Phaser.GameObjects.Container, stars: number): void {
  for (let i = 0; i < stars; i++) {
    const x = (i - (stars - 1) / 2) * 18;
    const star = scene.textures.exists('icon-star-full')
      ? scene.add.image(x, 66, 'icon-star-full').setDisplaySize(16, 16)
      : text(scene, x, 66, '★', 16).setOrigin(.5).setColor('#F0C35C');
    node.add(star.setName('map-earned-star'));
  }
}

/** One short, twelve-object burst; completed effects destroy their own objects. */
export function celebrateUnlock(scene: Phaser.Scene, x: number, y: number): void {
  if (reducedMotion()) return;
  const colors = [0x43c6a5, 0x7fe0b8, 0xf0c35c, 0xecf4f6];
  for (let i = 0; i < 12; i++) {
    const leaf = scene.textures.exists('icon-leaf')
      ? scene.add.image(x, y, 'icon-leaf').setDisplaySize(12, 12).setTint(colors[i % colors.length])
      : scene.add.rectangle(x, y, 5, 8, colors[i % colors.length]);
    leaf.setDepth(12).setName('map-unlock-leaf');
    scene.tweens.add({ targets: leaf, x: x + (i % 2 ? 1 : -1) * (24 + i * 5), y: y - 80 + (i % 4) * 24, angle: i * 37, alpha: 0, duration: 800 + i * 30, ease: 'Cubic.Out', onComplete: () => leaf.destroy() });
  }
}
