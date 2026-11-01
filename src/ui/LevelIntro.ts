import Phaser from 'phaser';
import type { LevelData } from '../core/types';
import { TOOLS } from '../core/tools';
import { accessibleTarget } from './accessibility';
import { reducedMotion } from './pixel';
import { text } from './theme';

function mechanicHint(level: LevelData): string {
  if (level.heatWave) return `Isı dalgası ${level.heatWave.fromStep + 1}–${level.heatWave.toStep + 1}. adımlarda`;
  if (level.blockedCells?.length) return 'İnşaat alanlarına yerleştirme yapılamaz';
  const limit = Object.entries(level.toolLimits ?? {})[0];
  if (limit) return `${TOOLS[limit[0] as keyof typeof TOOLS].name} limiti: ${limit[1]}`;
  if (level.deliveries?.length) return `Rotada ${level.deliveries.length} teslimat durağı var`;
  return 'Gölgeyi planla, kurye rotasını serinlet';
}

/** Presentation only: dismissing this card never starts or changes gameplay. */
export class LevelIntro extends Phaser.GameObjects.Container {
  private timer: Phaser.Time.TimerEvent;
  private dismissed = false;
  constructor(scene: Phaser.Scene, level: LevelData, index: number, private revealObjectives: () => void) {
    super(scene, 48, 132); scene.add.existing(this); this.setDepth(75).setName('level-intro');
    const title = `Bölüm ${index + 1} · ${level.name}`;
    this.add(scene.add.rectangle(0, 0, 756, 160, 0x101c2c, .97).setOrigin(0).setStrokeStyle(2, 0x43c6a5));
    this.add(text(scene, 24, 18, title, 30, 706).setColor('#ECF4F6'));
    const difficulty = level.difficulty ?? Math.min(4, index + 1);
    this.add(text(scene, 24, 62, 'Zorluk ' + '●'.repeat(difficulty) + '○'.repeat(4 - difficulty), 20).setColor('#F0C35C'));
    this.add(text(scene, 24, 94, mechanicHint(level), 20, 700).setColor('#7FE0B8'));
    this.add(text(scene, 24, 132, 'Devam etmek için tıkla', 14).setColor('#B7BEC0'));
    this.setSize(756, 160).setInteractive(new Phaser.Geom.Rectangle(0, 0, 756, 160), Phaser.Geom.Rectangle.Contains).on('pointerup', () => this.dismiss());
    const native = document.createElement('button'); native.textContent = title + ' · Devam'; native.onclick = () => this.dismiss();
    accessibleTarget(scene, this, native, { x: 0, y: 0, width: 756, height: 160 });
    if (!reducedMotion()) { this.setAlpha(0); scene.tweens.add({ targets: this, alpha: 1, duration: 140 }); }
    this.timer = scene.time.delayedCall(1800, () => this.dismiss());
    this.once('destroy', () => this.timer.remove());
  }
  private dismiss(): void {
    if (this.dismissed || !this.active) return;
    this.dismissed = true; this.destroy(); this.revealObjectives();
  }
}
