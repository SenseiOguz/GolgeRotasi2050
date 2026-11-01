import Phaser from 'phaser';
import type { Tool } from '../core/types';
import { COLORS, text } from './theme';
import { TOOL_TEXTURES } from '../assets/textureKeys';
import { sfx } from '../assets/sfx';
import { frame, icon, pixelMode } from './pixel';
import { accessibleTarget } from './accessibility';
export class ToolCard extends Phaser.GameObjects.Container {
  private box: Phaser.GameObjects.Rectangle;
  private skin?: Phaser.GameObjects.NineSlice;
  private status: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Rectangle;
  private usable = true;
  private selected = false;
  private baseY: number;
  constructor(scene: Phaser.Scene, x: number, y: number, readonly tool: Tool, select: () => void) {
    super(scene, x, y); scene.add.existing(this); this.baseY = y;
    this.glow = scene.add.rectangle(-3, -3, 398, 100, COLORS.cool, .12).setOrigin(0).setVisible(false);
    this.box = scene.add.rectangle(0, 0, 392, 94, COLORS.panel).setOrigin(0).setStrokeStyle(1, COLORS.edge);
    this.status = text(scene, 92, 70, '', 13).setColor('#F0C35C');
    const effect = 'Merkez −' + tool.coolingCenter + ' ısı' + (tool.coolingNeighbor ? ' · Komşu −' + tool.coolingNeighbor : '');
    this.add([this.glow, this.box, scene.add.image(42, 40, TOOL_TEXTURES[tool.id]).setDisplaySize(58, 58), text(scene, 92, 9, tool.name, 21).setFontStyle('bold'), text(scene, 374, 13, tool.cost + ' ₺', 18).setOrigin(1, 0), text(scene, 92, 40, effect, 14), this.status]);
    if (pixelMode(scene)) {
      this.box.setFillStyle(0xffe6a3).setVisible(false);
      this.skin = frame(scene, 0, 0, 392, 94, 'ui-tool-card'); this.addAt(this.skin, 1);
      const picture = this.list.find(item => item instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image;
      picture.setTexture('icon-' + (tool.id === 'coolRoof' ? 'cool-roof' : tool.id)).setDisplaySize(48, 48);
      const labels = this.list.filter(item => item instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[];
      labels.find(label => label.text.includes('₺'))?.setText(String(tool.cost));
      this.add(icon(scene, 316, 30, 'icon-budget', 36));
    }
    const radius = scene.add.graphics();
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      radius.fillStyle(row === 1 && col === 1 ? COLORS.cool : tool.coolingNeighbor && (row === 1 || col === 1) ? COLORS.edge : COLORS.bg);
      radius.fillRoundedRect(25 + col * 10, 73 + row * 5, 7, 3, 1);
    }
    this.add(radius);
    this.setSize(392, 94).setInteractive(new Phaser.Geom.Rectangle(0, 0, 392, 94), Phaser.Geom.Rectangle.Contains);
    const lift = (hover: boolean): void => { scene.tweens.killTweensOf(this); scene.tweens.add({ targets: this, scale: 1, y: this.baseY - (this.selected ? 2 : 0) - (hover && this.usable ? 2 : 0), duration: 120 }); };
    this.on('pointerover', () => { lift(true); if (this.usable) sfx.play('hover'); }); this.on('pointerout', () => lift(false));
    this.on('pointerdown', () => { if (this.usable) { sfx.play('click'); select(); scene.tweens.killTweensOf(this); this.setScale(1); scene.tweens.add({ targets: this, scale: .985, yoyo: true, duration: 80 }); } });
    const native = document.createElement('button');
    native.onclick = () => this.emit('pointerdown');
    native.onpointerenter = () => this.emit('pointerover'); native.onpointerleave = () => this.emit('pointerout');
    accessibleTarget(scene, this, native, { x: 0, y: 0, width: 392, height: 94 }, () => { native.disabled = !this.usable; native.textContent = tool.name + ', ' + tool.cost + ' lira. ' + this.status.text; });
  }
  refresh(budget: number, selected: boolean, planning: boolean, remaining?: number): void {
    this.usable = planning && budget >= this.tool.cost && remaining !== 0; this.selected = selected;
    this.setAlpha(planning ? 1 : .5); this.box.setFillStyle(this.usable ? COLORS.panel : 0x172637);
    this.box.setStrokeStyle(selected ? 2 : 1, selected ? COLORS.cool : COLORS.edge); this.glow.setVisible(selected && planning);
    if (this.skin) {
      this.skin.clearTint();
      this.box.setFillStyle(0x8c959b, this.usable ? 0 : 1).setStrokeStyle(selected ? 3 : 2, selected ? COLORS.cool : 0x1b3044).setVisible(!this.usable || selected && planning);
      this.moveTo(this.box, 2);
    }
    this.status.setText(planning && budget < this.tool.cost ? 'Bütçe yetersiz' : selected ? 'SEÇİLİ · Haritaya yerleştir' : this.tool.coolingNeighbor ? 'Merkez + komşu hücreler' : 'Yalnızca merkez hücre');
    if (remaining !== undefined) this.status.setText(`Kalan: ${remaining} · ` + (remaining === 0 ? 'Bölüm limiti doldu' : this.status.text));
    this.status.setColor(pixelMode(this.scene) ? (planning && budget < this.tool.cost ? '#A23E3A' : '#1E5A47') : (planning && budget < this.tool.cost ? '#F0C35C' : '#43C6A5')); this.setY(this.baseY - (selected ? 2 : 0));
  }
}
