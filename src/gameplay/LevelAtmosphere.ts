import type Phaser from 'phaser';
import type { GameState } from '../core/types';
import { tileCenter } from '../ui/layout';
import { particle } from './fx';
import { computeRun } from '../core/rules';
import { reducedMotion } from '../ui/pixel';

/** Small fixed population, shared particle cap, no input or state changes. */
export class LevelAtmosphere {
  constructor(private scene: Phaser.Scene, state: GameState) {
    if (reducedMotion()) return;
    const difficulty = state.level.difficulty;
    if (difficulty === 1 || difficulty === 3) {
      const cells = state.tiles.flat().filter(tile => tile.type === (difficulty === 1 ? 'park' : 'building')
        && !state.level.blockedCells?.some(cell => cell.x === tile.x && cell.y === tile.y)).slice(0, 4);
      cells.forEach((cell, index) => {
        const p = tileCenter(cell.x, cell.y);
        const speck = particle(scene, p.x - 26, p.y - 22, difficulty === 1 ? 0xb7dda0 : 0xc6c1b2);
        if (!speck) return;
        speck.setName('level-atmosphere').setDepth(3).setAlpha(difficulty === 1 ? .35 : .08);
        if (difficulty === 3) speck.setDisplaySize(22, 6);
        scene.tweens.add({targets:speck,x:p.x + (difficulty === 1 ? -8 : -14),y:p.y - 34,
          alpha:difficulty === 1 ? .12 : .025,duration:3200 + index * 350,delay:index * 450,yoyo:true,repeat:-1});
      });
    }
    if (difficulty === 4) {
      const hottest = computeRun(state).steps.sort((a,b) => b.heat - a.heat).slice(0,4);
      hottest.forEach((cell,index) => {
        const p = tileCenter(cell.x,cell.y);
        const shimmer = particle(scene,p.x,p.y - 25,0xf0a265);
        if (!shimmer) return;
        shimmer.setName('level-atmosphere').setDisplaySize(30,2).setDepth(4.1).setAlpha(.08);
        scene.tweens.add({targets:shimmer,y:p.y - 29,alpha:.025,scaleX:5,duration:1800 + index * 160,yoyo:true,repeat:-1});
      });
    }
  }

  heatStep(x: number, y: number, heat: number): void {
    if (reducedMotion() || heat < 50) return;
    for (let i=0;i<2;i++) {
      const shimmer=particle(this.scene,x,y - 22 + i * 5,0xf0a265);
      if (!shimmer) continue;
      shimmer.setName('heatwave-shimmer').setDisplaySize(32,2).setDepth(4.6).setAlpha(.22);
      this.scene.tweens.add({targets:shimmer,y:y - 34,alpha:0,duration:450 + i * 80,onComplete:()=>shimmer.destroy()});
    }
  }
}
