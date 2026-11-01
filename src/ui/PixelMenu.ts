import Phaser from 'phaser';
import { Button } from './Button';
import type { Modal } from './Modal';
import { text } from './theme';
import { frame, icon, loadPixelFont, reducedMotion } from './pixel';
import { showPixelHelp, showSettings } from './pixelModals';
import layout from '../../art/ui/concept/menu_v2_layout.json';

export async function createPixelMenu(scene: Phaser.Scene, play: () => void): Promise<void> {
  await loadPixelFont();
  if (!scene.scene.isActive()) return;
  scene.game.canvas.style.imageRendering = 'pixelated';
  scene.cameras.main.resetFX();
  let modal: Modal | undefined;
  let leaving = false;
  const reduce = reducedMotion();
  const maskShape = scene.make.graphics({ x: 0, y: 0 });
  const mask = maskShape.createGeometryMask();
  const hotMask = maskShape.createGeometryMask().setInvertAlpha(true);
  const layers: { image: Phaser.GameObjects.Image; y: number; depth: number; cloud: boolean }[] = [];
  const haze: Phaser.GameObjects.Image[] = [];
  const specs: [string, number][] = [['sky', 0], ['clouds', 0], ['skyline', 208], ['midground', 300], ['haze', 0], ['foreground', 520]];
  specs.forEach(([name, y], depth) => {
    for (const hot of [true, false]) {
      const key = `menu-${name}${hot ? '-hot' : ''}`;
      if (!scene.textures.exists(key)) continue;
      const image = scene.add.image(0, y, key).setOrigin(0).setScale(2);
      if (!hot) image.setMask(mask);
      layers.push({ image, y, depth, cloud: name === 'clouds' });
      if (name === 'haze') { image.setMask(hotMask); haze.push(image); }
    }
  });
  const wave = { x: reduce ? 1344 : -64 };
  const drawWave = (): void => {
    maskShape.clear().fillStyle(0xffffff).fillRect(0, 0, Math.max(0, wave.x - 32), 720);
    for (let x = 0; x < 64; x += 4) for (let y = 0; y < 720; y += 4) {
      if (((x / 4 + y / 4 * 3) % 16) / 16 < 1 - x / 64) maskShape.fillRect(Math.floor((wave.x - 32 + x) / 2) * 2, y, 4, 4);
    }
  };
  drawWave();
  if (!reduce) scene.tweens.add({ targets: wave, x: 1344, duration: 2000, onUpdate: drawWave, onComplete: () => haze.forEach(image => image.setVisible(false)) });
  else haze.forEach(image => image.setVisible(false));
  frame(scene, layout.panel.x * 2, layout.panel.y * 2, layout.panel.w * 2, layout.panel.h * 2);
  frame(scene, layout.badge.x * 2, layout.badge.y * 2, layout.badge.w * 2, layout.badge.h * 2, 'ui-badge-9');
  text(scene, 182, 26, 'COP31 · İKLİM DİRENÇLİ ŞEHİRLER', 14).setOrigin(.5, 0).setColor('#0B1320');
  frame(scene, layout.plate.x * 2, layout.plate.y * 2, layout.plate.w * 2, layout.plate.h * 2, scene.textures.exists('ui-logo-plate') ? 'ui-logo-plate' : 'ui-panel-9');
  text(scene, layout.titleText.x * 2, layout.titleText.y * 2, layout.titleText.text, layout.titleText.fontPx).setColor(layout.titleText.color).setShadow(2, 2, '#FFE6A3', 0, false, true);
  if (scene.textures.exists('ui-logo-2050')) scene.add.image(layout.logo2050.x * 2, layout.logo2050.y * 2, 'ui-logo-2050').setOrigin(0).setScale(2);
  else text(scene, 60, 134, '2050', 120).setColor('#2E7D5B');
  scene.add.image(layout.emblem.x * 2, layout.emblem.y * 2, 'menu-emblem').setOrigin(0).setScale(2);
  text(scene, layout.sloganText.x * 2, layout.sloganText.y * 2, layout.sloganText.text, layout.sloganText.fontPx, 400).setColor(layout.sloganText.color);
  const actions = [
    () => { if (!modal?.active && !leaving) { leaving = true; play(); } },
    () => { if (!modal?.active && !leaving) modal = showPixelHelp(scene, () => { modal = undefined; }); },
    () => { if (!modal?.active && !leaving) modal = showSettings(scene, () => { modal = undefined; }); },
  ];
  const buttons = layout.buttons.map((button, i) => new Button(scene, (button.x + button.w / 2) * 2, (button.y + button.h / 2) * 2, button.w * 2, button.label, actions[i], button.kind === 'primary', button.h * 2));
  frame(scene, layout.footer.x * 2, layout.footer.y * 2, layout.footer.w * 2, layout.footer.h * 2);
  text(scene, 40, 689, 'Eğitsel bir bulmaca; bilimsel iklim veya sağlık tahmini değildir.', 14);
  let focus = 0;
  const move = (direction: number): void => { if (modal?.active) return; buttons[focus].emit('pointerout'); focus = (focus + direction + buttons.length) % buttons.length; buttons[focus].emit('pointerover'); };
  scene.input.keyboard?.on('keydown-UP', () => move(-1));
  scene.input.keyboard?.on('keydown-DOWN', () => move(1));
  scene.input.keyboard?.on('keydown-ENTER', (event: KeyboardEvent) => { if (!(event.target instanceof HTMLButtonElement) && !modal?.active) buttons[focus].emit('pointerup'); });
  scene.input.keyboard?.on('keydown-ESC', () => { modal?.close(); modal = undefined; });
  const leaves = reduce ? [] : Array.from({ length: 5 }, (_, i) => icon(scene, 560 + i * 140, 80 + i * 108, 'icon-leaf', 16));
  const animate = (time: number): void => {
    if (reducedMotion()) { scene.tweens.killTweensOf(wave); wave.x = 1344; drawWave(); haze.forEach(image => image.setVisible(false)); leaves.forEach(leaf => leaf.setVisible(false)); return; }
    const px = Phaser.Math.Clamp((scene.input.activePointer.x - 640) / 640, -1, 1);
    const py = Phaser.Math.Clamp((scene.input.activePointer.y - 360) / 360, -1, 1);
    layers.forEach(layer => { layer.image.x = Math.round(px * Math.min(4, layer.depth + 1) + (layer.cloud ? Math.sin(time / 30000) * 8 : 0)); layer.image.y = layer.y + Math.round(py * Math.min(4, layer.depth + 1)); });
    haze.forEach(image => image.setAlpha(.35 + Math.sin(time / 700) * .12).setY(Math.round(Math.sin(time / 900) * 2)));
    leaves.forEach((leaf, i) => { leaf.x = 520 + ((time / (90 + i * 12) + i * 148) % 780); leaf.y = 80 + ((time / (70 + i * 5) + i * 108) % 560); leaf.angle = Math.sin(time / 1600 + i) * 22; });
  };
  scene.events.on('update', animate);
  scene.events.once('shutdown', () => { scene.events.off('update', animate); mask.destroy(); hotMask.destroy(); maskShape.destroy(); scene.input.keyboard?.removeAllListeners(); });
}
