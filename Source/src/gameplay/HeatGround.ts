import Phaser from 'phaser';
import type { GameState, Tile } from '../core/types';
import { groundKey, heatGround, heatStyle, heatBand, roadShape } from './visuals';
/** Separate ground visuals, always below objects; accessibility containers stay intact. */
export class HeatGround {
  private image?: Phaser.GameObjects.Image;
  private pattern?: Phaser.GameObjects.Graphics;
  private patterns = new Set<Phaser.GameObjects.Graphics>();
  private key = '';
  private heat = -1;
  constructor(private scene: Phaser.Scene, private ground: Phaser.GameObjects.Container) {}
  update(tile: Tile, visible: boolean, state: GameState): void {
    if (!heatGround(tile)) return;
    const loaded = this.scene.registry.get('pixelTextureKeys') as string[];
    const band = heatBand(tile.heat);
    const suffix = band === 'normal' ? '' : '-' + band;
    const shaped = tile.type === 'road' ? 'tile-road' + roadShape(state, tile.x, tile.y) + suffix : groundKey(tile);
    const requested = loaded.includes(shaped) ? shaped : groundKey(tile);
    const key = loaded.includes(requested) && this.scene.textures.exists(requested) ? requested : `tile-${tile.type}`;
    if (key !== this.key && loaded.includes(key)) {
      const old = this.image;
      if (!old) this.ground.list.forEach(child => (child as Phaser.GameObjects.Image).setVisible(false));
      this.image = this.scene.add.image(0, 0, key).setDisplaySize(80, 80).setAlpha(old ? 0 : 1);
      this.ground.add(this.image);
      if (old) this.scene.tweens.add({ targets: this.image, alpha: 1, duration: 300, onComplete: () => old.destroy() });
      this.key = key;
    }
    if (tile.heat !== this.heat) {
      const old = this.pattern;
      const style = heatStyle(tile.heat);
      this.pattern = this.scene.add.graphics().setDepth(0.5).setPosition(this.ground.x, this.ground.y).setVisible(visible);
      this.patterns.add(this.pattern);
      this.pattern.fillStyle(style.color, style.alpha);
      // A 4px Bayer lattice remains visibly pixelated at native x2 scale.
      const bayer = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
      for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
        if (bayer[(y % 4)*4+x % 4] < style.density) this.pattern.fillRect(-36+x*4,-36+y*4,4,4);
      }
      this.pattern.lineStyle(2,style.color,.95).strokeRect(-37,-37,74,74);
      if (old) {
        this.pattern.setAlpha(0);
        this.scene.tweens.add({ targets: this.pattern, alpha: 1, duration: 300 });
        this.scene.tweens.add({ targets: old, alpha: 0, duration: 300, onComplete: () => { this.patterns.delete(old); old.destroy(); } });
      }
      this.heat = tile.heat;
    }
    // Hide outgoing dissolve layers too when H is pressed during a transition.
    this.patterns.forEach(pattern => pattern.setVisible(visible));
  }
}
