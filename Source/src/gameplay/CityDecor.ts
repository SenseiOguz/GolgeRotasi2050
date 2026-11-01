import type Phaser from 'phaser';
import { PIXEL_ASSETS } from '../assets/pixelManifest';
import type { GameState } from '../core/types';
import { tileCenter } from '../ui/layout';
import { availablePixel } from './BuildingVisual';
import { worldDepth } from './visuals';
import { CITY_RING_GAPS, decorVisible, planDecor } from './decor';

/** Visual-only objects: never register input handlers or alter the grid's targets. */
export class CityDecor {
  private objects: { x: number; y: number; object: Phaser.GameObjects.Container }[] = [];
  constructor(scene: Phaser.Scene, state: GameState) {
    for (const item of planDecor(state)) {
      const key = availablePixel(scene,item.key);
      if (!key) continue;
      const p = tileCenter(item.x,item.y);
      const x=p.x+item.offsetX, y=p.y+item.offsetY;
      const image = scene.add.image(0,0,key).setOrigin(.5,1);
      const native = PIXEL_ASSETS.find(asset=>asset.key===key)?.nativeSize ?? {width:image.width,height:image.height};
      const width=native.width*2, height=native.height*2;
      image.setDisplaySize(width,height);
      const shadow=scene.add.image(6,4,key).setOrigin(.5,1).setDisplaySize(width,height).setTintFill(0x0b1320).setAlpha(.35);
      const object=scene.add.container(x,y,[shadow,image]).setDepth(worldDepth(y)).setName(`decor:${item.x},${item.y}`);
      this.objects.push({x:item.x,y:item.y,object});
    }
    this.update(state);
    this.drawRing(scene);
  }
  update(state: GameState, preview: readonly { x: number; y: number }[] = []): void {
    for (const item of this.objects) item.object.setVisible(decorVisible(state.tiles[item.y][item.x]) && !preview.some(cell=>cell.x===item.x && cell.y===item.y));
  }
  private drawRing(scene: Phaser.Scene): void {
    const road=availablePixel(scene,'tile-road');
    const building=availablePixel(scene,'bldg-house-hot','bldg-a-hot');
    const tree=availablePixel(scene,'tool-tree');
    if (!road && !building && !tree) return;
    const ring=scene.add.container(0,0).setDepth(-2).setName('city-ring');
    const clip=scene.add.graphics().setVisible(false);
    clip.fillStyle(0xffffff);
    CITY_RING_GAPS.forEach(gap=>clip.fillRect(gap.x,gap.y,gap.width,gap.height));
    const mask=clip.createGeometryMask();
    ring.setMask(mask);
    ring.once('destroy',()=>{mask.destroy();clip.destroy();});
    const fragment=(key: string | undefined,x: number,y: number,height=80): void=>{
      if(key) ring.add(scene.add.image(x,y,key).setDisplaySize(80,height).setTint(0x66717a).setAlpha(.32));
    };
    for(let col=0;col<10;col++) {
      const x=72+col*80;
      fragment(col%3===0 ? tree ?? building : col%3===1 ? building ?? road : road,x,104);
      fragment(col%3===0 ? building ?? road : col%3===1 ? road : tree ?? road,x,610);
    }
    for(let row=0;row<6;row++) fragment(row%2 ? building ?? road : road ?? tree,-12,160+row*80);
  }
}
