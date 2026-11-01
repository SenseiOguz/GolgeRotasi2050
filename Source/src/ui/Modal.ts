import Phaser from 'phaser';
import { COLORS, text } from './theme';
import { frame, pixelMode } from './pixel';
import { accessibleTarget } from './accessibility';
export class Modal extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, title: string) {
    super(scene, 0, 0); scene.add.existing(this); this.setDepth(100);
    const scrim = scene.add.rectangle(640, 360, 1280, 720, COLORS.bg, .9).setInteractive();
    this.add([scrim, pixelMode(scene) ? frame(scene, 250, 86, 780, 548, 'ui-result-frame') : scene.add.rectangle(640, 360, 780, 548, COLORS.panel).setStrokeStyle(1, COLORS.edge), text(scene, 300, 124, title, 30, 680).setFontStyle('bold')]);
    const blocker = document.createElement('div'); blocker.setAttribute('aria-hidden', 'true');
    accessibleTarget(scene, this, blocker, { x: 0, y: 0, width: 1280, height: 720 });
    blocker.style.cursor = 'default';
    scrim.setAlpha(0); scene.tweens.add({ targets: scrim, alpha: 1, duration: 240 });
    this.setAlpha(0).setPosition(19.2, 25).setScale(.97); scene.tweens.add({ targets: this, alpha: 1, x: 0, y: 0, scale: 1, duration: 280, ease: 'Cubic.Out' });
  }
  close(): void { this.scene.tweens.add({ targets: this, alpha: 0, duration: 120, onComplete: () => this.destroy() }); }
}

