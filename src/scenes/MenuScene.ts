import Phaser from 'phaser';
import { pixelMode } from '../ui/pixel';
import { showSettings } from '../ui/pixelModals';
import { createPixelMenu } from '../ui/PixelMenu';
import { SCENE_KEYS } from '../core/constants';
import { emitEvent, onEvent, offEvent } from '../core/GameEvents';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { COLORS, text } from '../ui/theme';
import { TEXTURE_KEYS as K } from '../assets/textureKeys';
import { sfx } from '../assets/sfx';
export class MenuScene extends Phaser.Scene {
  private help?: Modal;
  private leaving = false;
  constructor() { super(SCENE_KEYS.MENU); }
  create(): void {
    this.game.canvas.style.imageRendering = 'auto';
    if (pixelMode(this)) { this.help = undefined; this.leaving = false; void createPixelMenu(this, () => this.play()); return; }
    this.help = undefined; this.leaving = false; this.cameras.main.resetFX(); this.cameras.main.fadeIn(280, 16, 28, 44);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 64, 54, 'COP31  /  İKLİM DİRENÇLİ ŞEHİRLER', 16).setColor('#43C6A5');
    const glow = this.add.circle(960, 310, 235, COLORS.hot, .045);
    this.tweens.add({ targets: glow, alpha: .35, scale: 1.08, duration: 2600, yoyo: true, repeat: -1 });
    text(this, 68, 166, 'GÖLGE ROTASI', 62).setFontStyle('bold').setColor('#263E50');
    text(this, 64, 160, 'GÖLGE ROTASI', 62).setFontStyle('bold');
    text(this, 64, 225, '2050', 82).setFontStyle('bold').setColor('#43C6A5');
    this.add.rectangle(69, 319, 68, 3, COLORS.hot).setOrigin(0);
    text(this, 68, 337, 'Sıcak hava dalgasındaki bir kentte,\nher gölge güvenli bir yolun başlangıcı.', 24, 600).setLineSpacing(8);
    new Button(this, 204, 466, 272, 'OYUNA BAŞLA', () => this.play(), true);
    new Button(this, 204, 522, 272, 'Nasıl Oynanır', () => this.howTo());
    new Button(this, 498, 578, 240, 'Ayarlar', () => { if (!this.help?.active) this.help = showSettings(this, () => { this.help = undefined; }); });
    const mute = new Button(this, 204, 578, 272, sfx.muted ? 'Ses kapalı' : 'Ses açık', () => emitEvent('MUTE_TOGGLED', { muted: !sfx.muted }));
    const updateMute = ({ muted }: { muted: boolean }): void => { mute.setLabel(muted ? 'Ses kapalı' : 'Ses açık'); };
    onEvent('MUTE_TOGGLED', updateMute);
    this.input.keyboard?.on('keydown-ENTER', () => { if (!this.help) this.play(); });
    this.input.keyboard?.on('keydown-H', () => this.howTo());
    this.input.keyboard?.on('keydown-ESC', () => { this.help?.close(); this.help = undefined; });
    this.events.once('shutdown', () => { offEvent('MUTE_TOGGLED', updateMute); this.input.keyboard?.removeAllListeners(); });
    text(this, 68, 654, 'Eğitsel bir bulmaca; bilimsel iklim veya sağlık tahmini değildir.', 15, 1120).setAlpha(.7);
    const city = this.add.container(820, 175);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 4; x++) {
      const key = x === 1 ? K.road : (x + y) % 4 === 0 ? K.park : K.building;
      city.add(this.add.image(x * 80, y * 80, key));
    }
    const courier = this.add.image(80, 160, K.courier); this.tweens.add({ targets: courier, y: 154, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    city.add([this.add.image(80, 320, K.start), this.add.image(80, 0, K.goal), this.add.image(0, 160, K.tree), this.add.image(160, 240, K.coolRoof), courier]);
    text(this, 780, 602, 'DAHA SERİN BİR KENT MÜMKÜN.', 17).setColor('#43C6A5');

  }
  private play(): void {
    if (this.leaving || this.help?.active) return; this.leaving = true;
    this.cameras.main.fadeOut(240, 16, 28, 44);
    this.time.delayedCall(250, () => this.scene.start(SCENE_KEYS.MAP));
  }
  private howTo(): void {
    if (this.help?.active || this.leaving) return;
    const modal = new Modal(this, 'Kenti serinlet. Rotayı koru.'); this.help = modal;
    const steps = ['Sıcak noktaları ve kurye rotasını incele.', 'Bütçenle uygun hücrelere serinlik yerleştir.', 'Simülasyonu başlat; rota ısı yükünü izle.', 'Sonucu gör, yeni bir stratejiyle yeniden dene.'];
    const icons = [K.courier, K.tree, K.canopy, K.coolRoof];
    steps.forEach((step, i) => { const y = 211 + i * 65;
      modal.add(this.add.circle(319, y + 14, 18, COLORS.cool, .15));
      modal.add(text(this, 319, y + 14, String(i + 1), 17).setOrigin(.5).setColor('#43C6A5'));
      modal.add(this.add.image(370, y + 14, icons[i]).setDisplaySize(42, 42));
      modal.add(text(this, 406, y, step, 19, 558));
    });
    modal.add(text(this, 300, 490, 'Müdahalelerin gerçek etkisi yerel koşullara göre değişir.', 17, 680));
    modal.add(new Button(this, 640, 568, 240, 'Anladım', () => { modal.close(); this.help = undefined; }, true));
  }
}


