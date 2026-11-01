import Phaser from 'phaser';
import { COLORS, text } from './theme';
import { sfx } from '../assets/sfx';
import { pixelMode, frame } from './pixel';
import { accessibleTarget } from './accessibility';
export class Button extends Phaser.GameObjects.Container {
  private enabled = true;
  private box: Phaser.GameObjects.Rectangle;
  private skin?: Phaser.GameObjects.NineSlice;
  private variant: string;
  readonly label: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, title: string, action: () => void, accent = false, height = 44) {
    super(scene, x, y);
    this.variant = accent ? 'primary' : 'secondary';
    this.box = scene.add.rectangle(0, 0, width, height, accent ? COLORS.cool : COLORS.panel).setStrokeStyle(1, COLORS.edge);
    this.label = text(scene, 0, 0, title, 17).setOrigin(.5).setColor(accent ? '#101C2C' : '#ECF4F6');
    this.add([this.box, this.label]); scene.add.existing(this);
    if (pixelMode(scene)) {
      this.box.setVisible(false);
      this.skin = frame(scene, -width / 2, -height / 2, width, height, `btn-${this.variant}-normal`);
      this.addAt(this.skin, 0);
      this.label.setFontSize(20).setFontStyle('bold').setColor(accent ? "#0B1320" : "#ECF4F6");
    }
    this.setSize(width, height).setInteractive({ useHandCursor: true });
    const animate = (scale: number, duration: number, lift = 0): void => { if (!this.active || !this.scene) return; scene.tweens.killTweensOf(this); scene.tweens.add({ targets: this, scale, ...(this.skin ? { y: y + lift } : {}), duration, ease: 'Sine.Out' }); };
    this.on('pointerover', () => { if (this.enabled) { this.setSkinState('hover'); animate(1.025, 100, -2); sfx.play('hover'); } });
    this.on('pointerout', () => { this.setSkinState(this.enabled ? 'normal' : 'disabled'); animate(1, 100); });
    this.on('pointerdown', () => { if (this.enabled) { this.setSkinState('pressed'); animate(.97, 70, 2); } });
    this.on('pointerup', () => { if (!this.enabled) return; this.setSkinState('hover'); animate(1, 160, -2); sfx.play('click'); action(); });
    const native = document.createElement('button');
    native.onclick = () => this.emit('pointerup');
    native.onpointerenter = () => this.emit('pointerover');
    native.onpointerleave = () => this.emit('pointerout');
    if (this.skin) { native.onfocus = () => this.emit('pointerover'); native.onblur = () => this.emit('pointerout'); }
    native.onpointerdown = () => this.emit('pointerdown');
    accessibleTarget(scene, this, native, { x: -width / 2, y: -height / 2, width, height }, () => {
      native.textContent = this.label.text; native.disabled = !this.enabled;
    });
  }
  private setSkinState(state: string): void { if (this.skin?.scene) this.skin.setTexture(`btn-${this.variant}-${state}`); }
  setEnabled(enabled: boolean): this { this.enabled = enabled; this.setSkinState(enabled ? "normal" : "disabled"); this.setAlpha(enabled || this.skin ? 1 : .4); return this; }
  setLabel(label: string): this { this.label.setText(label); return this; }
}

