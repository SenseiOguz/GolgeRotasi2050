import type Phaser from 'phaser';
import type { Tile } from '../core/types';
import { buildingFamily, worldDepth } from './visuals';
import { renderWorldObject } from './renderAdapter';
export function availablePixel(scene: Phaser.Scene, ...keys: string[]): string | undefined {
  const loaded = scene.registry.get('pixelTextureKeys') as string[] | undefined;
  return keys.find(key => loaded?.includes(key) && scene.textures.exists(key));
}
export class BuildingVisual {
  private key?: string;
  private object?: Phaser.GameObjects.Container;
  constructor(private scene: Phaser.Scene, private x: number, private y: number, private industrial = false) {}
  update(tile: Tile, animate = false): void {
    const state = tile.placed === 'coolRoof' ? 'coolroof' : 'hot';
    const key = tile.type === 'building'
      ? availablePixel(this.scene, ...(this.industrial ? [`bldg-${tile.x % 2 ? 'factory' : 'warehouse'}-${state}`] : []), `bldg-${buildingFamily(tile.x,tile.y)}-${state}`, `bldg-a-${state}`)
      : availablePixel(this.scene, tile.type === 'start' ? 'bldg-depot' : 'bldg-hospital');
    if (!key || key === this.key) return;
    const old = this.object;
    this.object = renderWorldObject(this.scene,key,tile.type,this.x,this.y).setDepth(worldDepth(this.y));
    if (old) {
      this.object.setAlpha(0);
      this.scene.tweens.add({targets:this.object,alpha:1,duration:300,onComplete:()=>old.destroy()});
    }
    if (animate && state === 'coolroof') {
      const shine = this.scene.add.rectangle(this.x,this.y-18,56,4,0xecf4f6,0.85).setDepth(4.5);
      this.scene.tweens.add({targets:shine,y:this.y-42,alpha:0,duration:450,onComplete:()=>shine.destroy()});
    }
    this.key = key;
  }
}
