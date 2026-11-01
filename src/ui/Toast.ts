import Phaser from 'phaser';
import { frame, pixelMode } from './pixel';
import { COLORS, text } from './theme';
export class Toast extends Phaser.GameObjects.Container {
  private message: Phaser.GameObjects.Text;
  private box: Phaser.GameObjects.Rectangle;
  private skin?: Phaser.GameObjects.NineSlice;
  private timer?: Phaser.Time.TimerEvent;
  constructor(scene: Phaser.Scene) {
    super(scene, 432, 642); scene.add.existing(this);
    this.message = text(scene, 0, 0, '', 19, 700).setOrigin(.5);
    this.box = scene.add.rectangle(0, 0, 790, 58, COLORS.panel).setStrokeStyle(2, COLORS.warn);
    this.add([this.box, this.message]);
    if (pixelMode(scene)) { this.box.setVisible(false); this.skin = frame(scene, -395, -29, 790, 58, scene.textures.exists('ui-toast-9') ? 'ui-toast-9' : 'ui-panel-9'); this.addAt(this.skin, 0); this.message.setColor('#A23E3A'); } this.setAlpha(0);
  }
  show(message: string, severity: 'warning' | 'error' | 'success' = 'warning'): void {
    this.box.setStrokeStyle(2, severity === 'error' ? COLORS.hot : severity === 'success' ? COLORS.cool : COLORS.warn);
    const key = severity === 'error' ? 'ui-toast-error-9' : severity === 'warning' ? 'ui-toast-warn-9' : 'ui-toast-9';
    if (this.skin && this.scene.textures.exists(key)) this.skin.setTexture(key);
    if (this.skin) this.message.setColor(severity === 'error' ? '#A23E3A' : severity === 'success' ? '#1E5A47' : '#3D2E35');
    this.timer?.remove(); this.scene.tweens.killTweensOf(this); this.message.setText(message); this.setY(674).setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, y: 642, duration: 160 });
    this.timer = this.scene.time.delayedCall(2600, () => this.scene.tweens.add({ targets: this, alpha: 0, y: 665, duration: 200 }));
  }
  hide(): void {
    this.timer?.remove(); this.scene.tweens.killTweensOf(this);
    this.message.setText(''); this.setAlpha(0);
  }
}
