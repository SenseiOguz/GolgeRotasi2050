import type Phaser from 'phaser';
import { sfx } from '../assets/sfx';
import { frame, icon, reducedMotion } from './pixel';
import { text } from './theme';
import type { Modal } from './Modal';
import type { StarDisplay } from './starDisplay';

export function addStars(scene: Phaser.Scene, modal: Modal, display: StarDisplay): void {
  if (!display.stars) return;
  const reduce = reducedMotion();
  const timers: Phaser.Time.TimerEvent[] = [];
  display.slots.forEach((filled, index) => {
    const star = icon(scene, 700 + index * 52, 127, reduce && filled ? 'icon-star-full' : 'icon-star-empty', 48).setName('result-star-' + (index + 1)).setData('filled', reduce && filled);
    modal.add(star);
    if (filled && !reduce) timers.push(scene.time.delayedCall(350 + index * 200, () => {
      if (!modal.active || !star.active) return;
      star.setTexture('icon-star-full').setData('filled', true).setScale(2.5);
      scene.tweens.add({ targets: star, scaleX: 2, scaleY: 2, duration: 180, ease: 'Back.Out' });
      sfx.play('star');
    }));
  });
  if (reduce) sfx.play('star');
  modal.once('destroy', () => timers.forEach(timer => timer.remove()));
  modal.add(text(scene, 752, 158, display.stars + ' / 3 yıldız', 14).setOrigin(.5, 0));
  modal.add(frame(scene, 274, 396, 732, 108));
  display.criteria.forEach((criterion, index) => {
    modal.add(icon(scene, 296, 414 + index * 24, criterion.passed ? 'icon-confirm' : 'icon-close', 22));
    const label = text(scene, 316, 404 + index * 24, criterion.explanation + ' (' + criterion.valueLabel + ')', 16, 678).setName('star-criterion-' + criterion.key);
    modal.add(label);
  });
  modal.add(text(scene, 288, 479, display.motivation, 16, 704).setColor('#1E5A47').setName('star-motivation'));
}
