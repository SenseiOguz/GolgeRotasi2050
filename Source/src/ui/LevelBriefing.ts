import Phaser from 'phaser';
import type { LevelData } from '../core/types';
import { Button } from './Button';
import { text } from './theme';
import { accessibleTarget } from './accessibility';

/** Dismissible, UI-only guidance. Never changes the selected tool or game state. */
export class LevelBriefing extends Phaser.GameObjects.Container {
  private page = 0;
  constructor(scene: Phaser.Scene, private level: LevelData, private tutorial: boolean) {
    super(scene, 0, 0); scene.add.existing(this); this.setDepth(60);
    const blocker = document.createElement('div'); blocker.setAttribute('aria-hidden', 'true');
    accessibleTarget(scene, this, blocker, { x: 48, y: 132, width: 756, height: 176 });
    this.draw();
  }
  private draw(): void {
    this.removeAll(true);
    const scene = this.scene;
    const steps = [
      { title: 'BÖLÜM HEDEFLERİ', body: this.level.objectives?.join('\n') || 'Kurye rotasının ısı yükünü bölüm eşiğinin altında tut.', target: { x: 420, y: 372 } },
      { title: '1 / 3 · Serinlik araçlarını tanı', body: 'Sağdaki kartlardan bir araç seç. Her kart maliyetini ve serinletme etkisini gösterir.', target: { x: 1030, y: 224 } },
      { title: '2 / 3 · Kurye rotasını koru', body: 'Yol üzerindeki sıcak noktaları incele. Uygun hücrelere ağaç veya gölgelik yerleştir.', target: { x: 420, y: 372 } },
      { title: '3 / 3 · Planını dene', body: 'Hazır olduğunda Simülasyonu Başlat düğmesine bas. Isı yükünü eşik altında tut.', target: { x: 1052, y: 518 } },
    ];
    const step = this.tutorial ? steps[this.page] : undefined;
    this.add(scene.add.rectangle(426, 220, 756, 176, 0x101c2c, .98).setStrokeStyle(2, 0x43c6a5).setInteractive());
    this.add(text(scene, 68, 146, step?.title ?? 'BÖLÜM HEDEFLERİ', 23, 650).setColor('#7FE0B8'));
    this.add(text(scene, 68, 184, step?.body ?? (this.level.objectives?.join('\n') || 'Kurye rotasının ısı yükünü bölüm eşiğinin altında tut.'), 19, 690).setColor('#ECF4F6'));
    if (step) {
      const arrow = scene.add.graphics().lineStyle(4, 0xf0c35c);
      const start = { x: step.target.x > 800 ? 804 : 426, y: 272 };
      arrow.lineBetween(start.x, start.y, step.target.x, step.target.y);
      arrow.strokeCircle(step.target.x, step.target.y, 24); this.add(arrow);
    }
    this.add(new Button(scene, 687, 278, 194, step && this.page < steps.length - 1 ? 'Devam' : 'Anladım', () => {
      if (step && this.page < steps.length - 1) { this.page++; this.draw(); } else this.destroy();
    }, true));
    this.add(new Button(scene, 130, 278, 130, 'Kapat', () => this.destroy()));
  }
}
