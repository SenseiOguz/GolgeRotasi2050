import { expect,it,vi } from 'vitest';
import type Phaser from 'phaser';
import { CourierVisual,movementDirection } from '../../src/gameplay/CourierVisual';
vi.mock('phaser',()=>({default:{}}));
vi.mock('../../src/assets/pixelManifest',()=>({PIXEL_ASSETS:[{key:'courier-walk-e',frames:4}]}));
it('selects all four movement directions',()=>{
  expect([[80,0],[-80,0],[0,80],[0,-80]].map(([x,y])=>movementDirection(x,y))).toEqual(['e','w','s','n']);
});
it('syncs sheet frames to step progress and falls back to courier for missing directions',()=>{
  const textures:string[]=[],frames:number[]=[];
  const sprite={texture:{key:'courier'},setTintFill:()=>sprite,setAlpha:()=>sprite,stop:()=>sprite,setTexture:(key:string)=>{textures.push(key);return sprite;},setOrigin:()=>sprite,setDisplaySize:()=>sprite,setFrame:(frame:number)=>{frames.push(frame);return sprite;}};
  const scene={registry:{get:()=>['courier','courier-walk-e']},textures:{exists:()=>true},add:{sprite:()=>sprite}} as unknown as Phaser.Scene;
  const container={list:[],add:()=>{},setDepth:()=>{},y:320} as unknown as Phaser.GameObjects.Container;
  const visual=new CourierVisual(scene,container);
  visual.move(80,0);visual.update(.5);expect(textures.at(-1)).toBe('courier-walk-e');expect(frames.at(-1)).toBe(2);
  visual.move(0,-80);expect(textures.at(-1)).toBe('courier');
  visual.idle();expect(textures.at(-1)).toBe('courier');
});
