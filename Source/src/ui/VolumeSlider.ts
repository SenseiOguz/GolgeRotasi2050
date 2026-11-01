import Phaser from 'phaser';
import { accessibleTarget } from './accessibility';
import { frame, icon } from './pixel';
import { text } from './theme';

/** A real range input over the pixel track; its value always comes from the audio adapter. */
export class VolumeSlider extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, getVolume: () => number, setVolume: (value: number) => void, title = 'Ses seviyesi') {
    super(scene, x, y); scene.add.existing(this);
    this.add(text(scene, 0, -22, title, 18));
    const percent = text(scene, width, -22, '', 18).setOrigin(1, 0); this.add(percent);
    const track = scene.textures.exists('ui-slider-track') ? frame(scene, 0, 8, width, 24, 'ui-slider-track') : scene.add.rectangle(0, 8, width, 24, 0x1b3044).setOrigin(0);
    const fill = scene.textures.exists('ui-slider-fill') ? frame(scene, 0, 8, width, 24, 'ui-slider-fill') : scene.add.rectangle(0, 8, width, 24, 0x43c6a5).setOrigin(0);
    const knob = scene.textures.exists('ui-slider-knob') ? icon(scene, width, 20, 'ui-slider-knob', 32) : scene.add.rectangle(width, 20, 24, 32, 0xf0c35c);
    this.add([track, fill, knob]);
    const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '5'; input.setAttribute('aria-label', title); input.style.opacity = '0';
    input.oninput = () => setVolume(Number(input.value) / 100);
    input.onfocus = () => knob.setAlpha(.65); input.onblur = () => knob.setAlpha(1);
    let previous = -1;
    accessibleTarget(scene, this, input, { x: -16, y: 0, width: width + 32, height: 44 }, () => {
      const value = Phaser.Math.Clamp(getVolume(), 0, 1);
      if (value === previous) return; previous = value;
      input.value = String(Math.round(value * 100)); input.setAttribute('aria-valuetext', '%' + input.value); percent.setText('%' + input.value);
      knob.setX(value * width); fill.setVisible(value > 0);
      if (fill instanceof Phaser.GameObjects.NineSlice) fill.setSize(Math.max(6, width * value / 2), 12);
      else fill.width = width * value;
    });
  }
}
