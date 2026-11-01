import type Phaser from 'phaser';
import { PIXEL_ASSETS } from '../assets/pixelManifest';
import { availablePixel } from './BuildingVisual';
import { worldDepth } from './visuals';
export type Direction = 's' | 'e' | 'n' | 'w';
export const movementDirection = (dx: number, dy: number): Direction => Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'w' : 'e' : dy < 0 ? 'n' : 's';
/** Walk frames follow tween progress, so each sheet cycle lasts exactly one SIM_STEP. */
export class CourierVisual {
  private sprite?: Phaser.GameObjects.Sprite;
  private shadow?: Phaser.GameObjects.Sprite;
  private frames = 1;
  private walking = false;
  constructor(private scene: Phaser.Scene, private container: Phaser.GameObjects.Container) { this.idle(); }
  private show(...keys: string[]): void {
    const key = availablePixel(this.scene,...keys);
    if (!key) return;
    const asset = PIXEL_ASSETS.find(a=>a.key===key);
    this.frames = asset?.frames ?? 1;
    if (!this.sprite) {
      this.container.list.forEach(child=>(child as Phaser.GameObjects.Image).setVisible(false));
      this.shadow = this.scene.add.sprite(6,44,key).setTintFill(0x0b1320).setAlpha(.35);
      this.sprite = this.scene.add.sprite(0,40,key);
      this.container.add([this.shadow,this.sprite]);
    }
    for (const sprite of [this.sprite,this.shadow!]) {
      sprite.stop().setTexture(key,0).setOrigin(asset?.anchor?.x ?? .5,asset?.anchor?.y ?? .875);
      sprite.setDisplaySize((asset?.nativeSize?.width ?? 48)*2,(asset?.nativeSize?.height ?? 48)*2);
    }
  }
  move(dx: number, dy: number): void {
    if (!dx && !dy) { this.idle(); return; }
    const direction = movementDirection(dx,dy);
    this.show(`courier-walk-${direction}`,direction === 's' ? 'courier' : `courier-${direction}`,'courier');
    this.walking = true;
  }
  update(progress: number): void {
    if (this.walking) {
      const frame = Math.min(this.frames-1,Math.floor(progress*this.frames));
      this.sprite?.setFrame(frame); this.shadow?.setFrame(frame);
    }
    this.container.setDepth(worldDepth(this.container.y));
  }
  idle(): void {
    this.walking = false; this.show('courier-idle-s','courier-idle','courier');
    const texture = this.sprite?.texture.key;
    if (texture && this.frames > 1) {
      const key = 'px-' + texture;
      if (!this.scene.anims.exists(key)) this.scene.anims.create({key,frames:this.scene.anims.generateFrameNumbers(texture,{start:0,end:this.frames-1}),frameRate:6,repeat:-1});
      this.sprite?.play(key); this.shadow?.play(key);
    }
  }
  deliver(): void {
    this.walking = false;
    this.show('courier-deliver','courier-idle-s','courier');
    if (this.frames > 1) this.scene.tweens.addCounter({from:0,to:this.frames-1,duration:450,onUpdate:t=>{
      const frame=Math.floor(t.getValue() ?? 0);this.sprite?.setFrame(frame);this.shadow?.setFrame(frame);
    }});
    else this.scene.tweens.add({targets:this.container,scale:1.06,yoyo:true,repeat:1,duration:120});
  }
}
