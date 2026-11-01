import type Phaser from 'phaser';
import { expect, it, vi } from 'vitest';
import { renderWorldObject } from '../../src/gameplay/renderAdapter';
import { availablePixel } from '../../src/gameplay/BuildingVisual';
import { buildingFamily, worldDepth } from '../../src/gameplay/visuals';
vi.mock('phaser',()=>({default:{}}));
vi.mock('../../src/assets/pixelManifest',()=>({PIXEL_ASSETS:[{key:'bldg-a-hot',nativeSize:{width:40,height:56}}]}));
it('bounds building overhang, bottom aligns and fills silhouette shadow at bible offset',()=>{
  const images: Record<string,unknown>[]=[];
  const container={add:vi.fn()};
  const scene={add:{container:()=>container,image:(x:number,y:number,key:string)=>{
    const data:Record<string,unknown>={x,y,key};images.push(data);
    const image={width:40,height:56,setOrigin:(x:number,y:number)=>{data.origin=[x,y];return image;},setDisplaySize:(w:number,h:number)=>{data.size=[w,h];return image;},setTintFill:(color:number)=>{data.tint=color;return image;},setAlpha:(alpha:number)=>{data.alpha=alpha;return image;}};return image;
  }}} as unknown as Phaser.Scene;
  renderWorldObject(scene,'bldg-a-hot','building',72,160);
  expect(images[0]).toMatchObject({x:0,y:40,origin:[.5,1],size:[80,96]});
  expect(images[1]).toMatchObject({x:6,y:44,tint:0x0b1320,alpha:.35,size:[80,96]});
});
it('uses loaded existing keys only, with deterministic fallback and depth',()=>{
  const scene={registry:{get:()=>['bldg-a-hot']},textures:{exists:(key:string)=>key==='bldg-a-hot'}} as unknown as Phaser.Scene;
  expect(availablePixel(scene,'bldg-house-hot','bldg-a-hot')).toBe('bldg-a-hot');
  expect(availablePixel(scene,'bldg-depot')).toBeUndefined();
  const families=new Set<string>();
  for(let y=0;y<6;y++) for(let x=0;x<10;x++) {families.add(buildingFamily(x,y));expect(buildingFamily(x,y)).toBe(buildingFamily(x,y));}
  expect(families.size).toBe(4);
  expect(worldDepth(240)).toBeGreaterThan(worldDepth(160));
  expect(worldDepth(600)).toBeLessThan(4);
});
