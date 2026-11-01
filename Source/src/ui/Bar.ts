import Phaser from 'phaser';
import { frame, pixelMode } from './pixel';
import { COLORS, text } from './theme';
export class Bar extends Phaser.GameObjects.Container {
  private fill: Phaser.GameObjects.Rectangle;
  private segments: Phaser.GameObjects.Rectangle[] = [];
  private displayed = { value: 0 };
  private label: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, x: number, y: number, private barWidth: number) {
    super(scene, x, y); scene.add.existing(this);
    this.fill = scene.add.rectangle(0, 29, 0, 8, COLORS.cool).setOrigin(0);
    this.label = text(scene, 0, 0, '0 / 0', 18);
    this.add([scene.add.rectangle(0, 29, barWidth, 8, COLORS.edge).setOrigin(0), this.fill, scene.add.rectangle(barWidth / 1.4, 33, 2, 16, COLORS.text), this.label]);
    if (pixelMode(scene)) {
      this.fill.setVisible(false);
      this.addAt(frame(scene, -4, 22, barWidth + 8, 22, 'ui-heat-gauge'), 0);
      for (let i = 0; i < 24; i++) { const segment = scene.add.rectangle(i * barWidth / 24 + 2, 28, barWidth / 24 - 3, 10, COLORS.cool).setOrigin(0); this.segments.push(segment); this.add(segment); }
      this.add(scene.add.rectangle(barWidth / 1.4, 33, 2, 26, 0x1b3044));
    }
  }
  updateValue(value: number, max: number, immediate = false): void {
    this.scene.tweens.killTweensOf(this.displayed);
    const render = (): void => {
      const current = this.displayed.value;
      this.label.setText(`${Math.round(current)} / ${max} eşik`);
      this.fill.width = this.barWidth * Math.min(1, Math.max(0, max > 0 ? current / (max * 1.4) : 0));
      this.segments.forEach((segment, i) => { const ratio = max > 0 ? current / (max * 1.4) : 0; segment.setFillStyle(i / 24 > ratio ? 0xc9a57a : current > max ? COLORS.hot : current > max * .85 ? COLORS.warn : COLORS.cool); });
      this.fill.setFillStyle(current > max ? COLORS.hot : current > max * .85 ? COLORS.warn : COLORS.cool);
    };
    if (immediate) { this.displayed.value = value; render(); }
    else this.scene.tweens.add({ targets: this.displayed, value, duration: 320, ease: 'Sine.Out', onUpdate: render });
  }
}
