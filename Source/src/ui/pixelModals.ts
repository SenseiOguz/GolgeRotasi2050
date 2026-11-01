import type Phaser from 'phaser';
import { Button } from './Button';
import { Modal } from './Modal';
import { text } from './theme';
import { icon, reducedMotion } from './pixel';
import { sfx } from '../assets/sfx';
import { emitEvent, onEvent, offEvent } from '../core/GameEvents';
import { VolumeSlider } from './VolumeSlider';
import { createLevelManager } from '../core/levelManager';

function addClose(scene: Phaser.Scene, modal: Modal, close: () => void): void {
  if (!scene.textures.exists('icon-close')) return;
  const button = new Button(scene, 984, 122, 40, 'Kapat', () => { modal.close(); close(); });
  button.label.setVisible(false); button.add(icon(scene, 0, 0, 'icon-close', 32)); modal.add(button);
}

export function showPixelHelp(scene: Phaser.Scene, close: () => void): Modal {
  const modal = new Modal(scene, 'Kenti serinlet. Rotayı koru.');
  const steps = ['Sıcak noktaları ve kurye rotasını incele.', 'Bütçenle uygun hücrelere serinlik yerleştir.', 'Simülasyonu başlat; rota ısı yükünü izle.', 'Sonucu gör, yeni bir stratejiyle yeniden dene.'];
  const keys = ['icon-heatmap', 'icon-tree', 'icon-play', 'icon-confirm'];
  steps.forEach((step, i) => {
    modal.add(icon(scene, 332, 224 + i * 62, keys[i], 44));
    modal.add(text(scene, 376, 211 + i * 62, `${i + 1}. ${step}`, 21, 580));
  });
  modal.add(text(scene, 300, 490, 'Müdahalelerin gerçek etkisi yerel koşullara göre değişir.', 18, 680));
  modal.add(new Button(scene, 640, 568, 240, 'Anladım', () => { modal.close(); close(); }, true));
  addClose(scene, modal, close);
  return modal;
}
export function showSettings(scene: Phaser.Scene, close: () => void): Modal {
  const modal = new Modal(scene, 'AYARLAR');
  modal.add(text(scene, 300, 176, 'Tercihlerin bu cihazda saklanır. Sessize al tüm sesleri kapatır.', 18, 680));
  const toggleKey = (enabled: boolean): string => enabled ? 'ui-toggle-on' : 'ui-toggle-off';
  const sound = new Button(scene, 464, 240, 328, sfx.muted ? 'Ses efektleri: KAPALI' : 'Ses efektleri: AÇIK', () => emitEvent('MUTE_TOGGLED', { muted: !sfx.muted }), true);
  sound.label.setFontSize(17).setX(28);
  const switchImage = scene.textures.exists('ui-toggle-on') ? icon(scene, -126, 0, toggleKey(!sfx.muted), 64) : undefined;
  if (switchImage) sound.add(switchImage);
  const ambient = new Button(scene, 816, 240, 328, sfx.ambienceEnabled ? 'Şehir ambiyansı: AÇIK' : 'Şehir ambiyansı: KAPALI', () => {
    sfx.setAmbienceEnabled(!sfx.ambienceEnabled);
    ambient.setLabel(sfx.ambienceEnabled ? 'Şehir ambiyansı: AÇIK' : 'Şehir ambiyansı: KAPALI'); ambientSwitch?.setTexture(toggleKey(sfx.ambienceEnabled));
  });
  ambient.label.setFontSize(16).setX(28);
  const ambientSwitch = scene.textures.exists('ui-toggle-on') ? icon(scene, -126, 0, toggleKey(sfx.ambienceEnabled), 64) : undefined;
  if (ambientSwitch) ambient.add(ambientSwitch);
  const update = ({ muted }: { muted: boolean }): void => { sound.setLabel(muted ? 'Ses efektleri: KAPALI' : 'Ses efektleri: AÇIK'); switchImage?.setTexture(toggleKey(!muted)); };
  onEvent('MUTE_TOGGLED', update); modal.once('destroy', () => offEvent('MUTE_TOGGLED', update));
  modal.add([sound, ambient]);
  modal.add(new VolumeSlider(scene, 304, 312, 304, () => sfx.volume, value => sfx.setVolume(value)));
  modal.add(new VolumeSlider(scene, 664, 312, 304, () => sfx.ambienceVolume, value => sfx.setAmbienceVolume(value), 'Ambiyans seviyesi'));
  modal.add(text(scene, 304, 378, 'Hafif şehir uğultusu, kuşlar ve ağustos böcekleri.\nAmbiyans, rotanın gerçek ısı yüküne göre değişir.\nSes, ilk tıklama veya tuş basışından sonra başlar.', 19, 660).setLineSpacing(6));
  let reduce = reducedMotion();
  const motion = new Button(scene, 640, 486, 440, reduce ? 'Animasyonları azalt: AÇIK' : 'Animasyonları azalt: KAPALI', () => {
    reduce = !reduce; try { localStorage.setItem('golge-rotasi-reduced-motion', String(reduce)); } catch { /* Optional persistence. */ }
    motion.setLabel(reduce ? 'Animasyonları azalt: AÇIK' : 'Animasyonları azalt: KAPALI');
  });
  let confirming = false;
  const reset = new Button(scene, 640, 540, 440, 'İlerlemeyi Sıfırla', () => {
    if (!confirming) { confirming = true; reset.setLabel('Emin misin? İlerlemeyi Sıfırla'); return; }
    createLevelManager().reset(); confirming = false; reset.setLabel('İlerleme sıfırlandı');
  });
  modal.add([motion, reset, new Button(scene, 640, 596, 240, 'Tamam', () => { modal.close(); close(); }, true)]);
  addClose(scene, modal, close); return modal;
}
