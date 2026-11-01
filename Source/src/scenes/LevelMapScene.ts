import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/constants';
import { createLevelManager, type LevelManager } from '../core/levelManager';
import { MAP_LAYOUT } from '../assets/pixelManifest';
import { sfx } from '../assets/sfx';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { text } from '../ui/theme';
import { pixelMode, reducedMotion } from '../ui/pixel';
import { accessibleTarget } from '../ui/accessibility';
import { MAP_INFO_RECT, canPlay, consumeUnlock, currentLevel, mapLayout, nodeState, pointOnPath } from '../ui/levelMap';
import type { Point } from '../ui/levelMap';
import { addCurrentGlow, addEarnedStars, addMapAtmosphere, celebrateUnlock } from '../ui/mapAtmosphere';

export class LevelMapScene extends Phaser.Scene {
  private manager!: LevelManager;
  private selected = 0;
  private current = '';
  private pending: string | null = null;
  private leaving = false;
  private animating = false;
  private nodes: Phaser.GameObjects.Container[] = [];
  private card?: Phaser.GameObjects.Container;
  private courier?: Phaser.GameObjects.Sprite;
  private toast!: Toast;
  constructor() { super(SCENE_KEYS.MAP); }
  create(): void {
    this.manager = createLevelManager(); this.current = currentLevel(this.manager);
    this.pending = consumeUnlock(this.manager); this.leaving = false; this.nodes = []; this.card = undefined;
    const newlyUnlocked = this.pending;
    this.animating = !!this.pending && !reducedMotion();
    if (!this.animating) this.pending = null;
    this.cameras.main.resetFX(); this.cameras.main.fadeIn(240);
    this.game.canvas.style.imageRendering = pixelMode(this) ? 'pixelated' : 'auto';
    const levels = this.manager.levels(), layout = mapLayout(levels, MAP_LAYOUT);
    if (this.textures.exists('map-bg') && pixelMode(this)) this.add.image(0, 0, 'map-bg').setOrigin(0).setScale(2);
    else {
      this.cameras.main.setBackgroundColor('#C6F2D8');
      const city = this.add.graphics();
      for (let y = 110; y < 490; y += 68) for (let x = 30; x < 1240; x += 82) {
        city.fillStyle((x + y) % 3 ? 0x7fe0b8 : 0xc9a57a).fillRect(x, y, 54, 42);
        city.fillStyle(0xecf4f6).fillRect(x + 4, y + 4, 46, 6);
      }
    }
    addMapAtmosphere(this);
    this.add.rectangle(640, 48, 1280, 96, 0x101c2c, .94);
    text(this, 40, 20, 'GÖLGE ROTASI · BÖLÜM HARİTASI', 30).setColor('#ECF4F6');
    if (levels.length > 0 && levels.every(level => this.manager.isCompleted(level.id))) {
      const stars = levels.reduce((sum, level) => sum + (this.manager.record(level.id)?.stars ?? 0), 0);
      text(this, 42, 60, `Tüm bölümler tamamlandı!  ★ ${stars} / ${levels.length * 3}`, 23, 980).setColor('#F0C35C').setName('map-completion-banner');
    } else text(this, 42, 62, '← → Seç   ·   Enter Oyna   ·   Esc Ana Menü', 17).setColor('#C6F2D8');
    new Button(this, 1140, 48, 200, 'Ana Menü', () => this.back());
    layout.paths.forEach((path, i) => this.drawPath(path, this.manager.isUnlocked(levels[i + 1].id) && levels[i + 1].id !== this.pending ? 1 : 0));
    const highlighted = levels.filter(level => this.manager.isUnlocked(level.id) && !this.manager.isCompleted(level.id)).at(-1)?.id;
    levels.forEach((level, i) => {
      const p = layout.nodes[i], node = this.add.container(p.x * 2, p.y * 2).setDepth(2);
      const state = this.animating && level.id === this.pending ? 'locked' : nodeState(this.manager, level.id, this.current);
      const key = 'map-node-' + state;
      if (pixelMode(this) && this.textures.exists(key)) node.add(this.add.image(0, 0, key).setScale(2));
      else node.add(this.add.circle(0, 0, 31, state === 'locked' ? 0x4a5560 : state === 'done' ? 0x2e7d5b : 0xf0c35c).setStrokeStyle(4, 0x101c2c));
      node.add(text(this, 0, -2, state === 'locked' ? '🔒' : state === 'done' ? '✓' : String(i + 1), 25).setOrigin(.5).setColor('#101C2C'));
      node.add(text(this, 0, 40, `Bölüm ${i + 1}`, 20).setOrigin(.5).setColor('#101C2C').setBackgroundColor('#C6F2D8'));
      addEarnedStars(this, node, this.manager.record(level.id)?.stars ?? 0);
      if (level.id === highlighted && !(this.animating && level.id === this.pending)) addCurrentGlow(this, node);
      node.setSize(68, 68).setInteractive({ useHandCursor: true });
      node.on('pointerover', () => this.select(i)); node.on('pointerup', () => this.play(i));
      const native = document.createElement('button'); native.textContent = `Bölüm ${i + 1} · ${level.name}${state === 'locked' ? ' · Kilitli' : ''}`;
      native.onclick = () => this.play(i); native.onfocus = () => this.select(i); native.onpointerenter = () => this.select(i);
      accessibleTarget(this, node, native, { x: -34, y: -34, width: 68, height: 68 }, () => {
        native.textContent = `Bölüm ${i + 1} · ${level.name}${!canPlay(this.manager, level.id) || this.animating && this.pending === level.id ? ' · Kilitli' : ''}`;
      });
      this.nodes.push(node);
    });
    this.toast = new Toast(this).setDepth(40);
    const startIndex = this.pending && this.animating ? Math.max(0, this.manager.index(this.pending) - 1) : Math.max(0, this.manager.index(this.current));
    const p = layout.nodes[startIndex];
    const courierKey = this.textures.exists('courier-idle-s') ? 'courier-idle-s' : 'courier';
    if (p && this.textures.exists(courierKey)) { this.courier = this.add.sprite(p.x * 2, p.y * 2 - 48, courierKey).setDisplaySize(80, 80).setDepth(10); this.animateCourier('courier-idle-s'); }
    this.select(startIndex);
    if (newlyUnlocked && !this.animating) sfx.play('star');
    if (this.animating && this.pending) {
      const index = this.manager.index(this.pending), path = layout.paths[index - 1], progress = { value: 0 };
      const road = this.add.graphics().setDepth(1); this.nodes.forEach(node => node.setDepth(2));
      let previous = pointOnPath(path, 0);
      this.tweens.add({ targets: progress, value: 1, duration: 1800, onUpdate: () => {
        const point = pointOnPath(path, progress.value);
        road.lineStyle(10, 0x43c6a5).lineBetween(previous.x * 2, previous.y * 2, point.x * 2, point.y * 2);
        if (this.courier) { this.courier.setPosition(point.x * 2, point.y * 2 - 48); const dx = point.x - previous.x, dy = point.y - previous.y; this.animateCourier('courier-walk-' + (Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? 'e' : 'w' : dy >= 0 ? 's' : 'n')); }
        previous = point;
      }, onComplete: () => {
        this.animating = false; this.current = levels[index].id; this.pending = null;
        const node = this.nodes[index]; node.removeAll(true);
        if (pixelMode(this) && this.textures.exists('map-node-open')) node.add(this.add.image(0, 0, 'map-node-open').setScale(2));
        else node.add(this.add.circle(0, 0, 31, 0xf0c35c).setStrokeStyle(4, 0x101c2c));
        node.add(text(this, 0, 0, String(index + 1), 25).setOrigin(.5).setColor('#101C2C'));
        node.add(text(this, 0, 40, `Bölüm ${index + 1}`, 20).setOrigin(.5).setColor('#101C2C').setBackgroundColor('#C6F2D8'));
        addCurrentGlow(this, node);
        this.tweens.add({ targets: node, scale: 1.2, yoyo: true, duration: 180 });
        celebrateUnlock(this, node.x, node.y);
        this.animateCourier('courier-idle-s'); sfx.play('star'); this.select(index);
      } });
    }
    this.input.keyboard?.on('keydown-LEFT', () => this.select((this.selected - 1 + levels.length) % levels.length));
    this.input.keyboard?.on('keydown-RIGHT', () => this.select((this.selected + 1) % levels.length));
    this.input.keyboard?.on('keydown-ENTER', (event: KeyboardEvent) => { if (!(event.target instanceof HTMLButtonElement)) this.play(this.selected); });
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    this.events.once('shutdown', () => { this.input.keyboard?.removeAllListeners(); this.courier = undefined; });
  }
  private animateCourier(key: string): void {
    if (!this.courier || !this.textures.exists(key) || reducedMotion()) return;
    if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 8, repeat: -1 });
    this.courier.play(key, true);
  }
  private drawPath(path: Point[], bright: number): void {
    const length = path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
    for (let d = 0; d <= length; d += 10) {
      const p = pointOnPath(path, length ? d / length : 0);
      if (pixelMode(this) && this.textures.exists('map-path-dot')) this.add.image(p.x * 2, p.y * 2, 'map-path-dot').setScale(2).setTint(bright ? 0x7fe0b8 : 0x4a5560);
      else this.add.circle(p.x * 2, p.y * 2, bright ? 6 : 4, bright ? 0x43c6a5 : 0x4a5560);
    }
  }
  private select(index: number): void {
    const level = this.manager.levels()[index]; if (!level || this.leaving) return;
    this.selected = index; this.card?.destroy(); this.card = this.add.container(0, 0).setDepth(20);
    const bounds = MAP_INFO_RECT;
    this.card.add(this.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, 0x101c2c, .96).setOrigin(0).setStrokeStyle(2, 0x43c6a5));
    const addText = (x: number, y: number, value: string, size: number, width?: number): void => { this.card?.add(text(this, x, y, value, size, width).setColor('#ECF4F6')); };
    addText(40, 648, `Bölüm ${index + 1} · ${level.name}`, 23, 550);
    addText(624, 650, 'Zorluk ' + '●'.repeat(level.difficulty ?? Math.min(4, index + 1)) + '○'.repeat(4 - (level.difficulty ?? Math.min(4, index + 1))), 17);
    addText(40, 680, level.subtitle ?? 'Kenti serinlet, kurye rotasını koru.', 17, 920);
    addText(832, 650, 'En iyi: ' + '★'.repeat(this.manager.record(level.id)?.stars ?? 0) + '☆'.repeat(3 - (this.manager.record(level.id)?.stars ?? 0)), 17);
    this.card.add(new Button(this, 1136, 680, 200, canPlay(this.manager, level.id) ? 'OYNA' : 'Kilitli', () => this.play(index), true).setEnabled(canPlay(this.manager, level.id) && !this.animating));
  }
  private play(index: number): void {
    if (this.leaving || this.animating) return;
    this.select(index); const level = this.manager.levels()[index]; if (!level) return;
    if (!canPlay(this.manager, level.id)) {
      this.toast.show('Önce önceki bölümü tamamla', 'warning'); sfx.play('reject');
      if (!reducedMotion()) this.tweens.add({ targets: this.nodes[index], x: this.nodes[index].x + 6, yoyo: true, repeat: 2, duration: 50 });
      return;
    }
    this.manager.setLastPlayed(level.id); this.leaving = true; this.cameras.main.fadeOut(220);
    this.time.delayedCall(230, () => this.scene.start(SCENE_KEYS.GAME, { levelId: level.id }));
  }
  private back(): void { if (!this.leaving) { this.leaving = true; this.scene.start(SCENE_KEYS.MENU); } }
}
