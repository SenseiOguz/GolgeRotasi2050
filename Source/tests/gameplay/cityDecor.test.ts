import type Phaser from 'phaser';
import { expect,it,vi } from 'vitest';
import { CityDecor } from '../../src/gameplay/CityDecor';
import { planDecor } from '../../src/gameplay/decor';
import { createState,placeTool } from '../../src/core/rules';
import { LEVELS } from '../../src/core/levels';
import { worldDepth } from '../../src/gameplay/visuals';
import { tileCenter } from '../../src/ui/layout';
vi.mock('../../src/assets/pixelManifest',()=>({PIXEL_ASSETS:[{key:'decor-bench',nativeSize:{width:24,height:24}}]}));
vi.mock('../../src/gameplay/BuildingVisual',()=>({availablePixel:(_scene:unknown,key:string)=>key.startsWith('decor-') ? key : undefined}));

it('renders manifest-native x2 decor and matching shadows, with preview/placement/undo visibility',()=>{
  const images: {key:string;x:number;y:number;origin?:number[];size?:number[];tint?:number;alpha?:number}[]=[];
  const objects: {x:number;y:number;depth?:number;visible?:boolean}[]=[];
  const scene={add:{image:(x:number,y:number,key:string)=>{
    const data:typeof images[number]={x,y,key};images.push(data);
    const image={width:key==='decor-bench' ? 8 : 24,height:key==='decor-bench' ? 8 : 24,
      setOrigin:(x:number,y:number)=>{data.origin=[x,y];return image;},
      setDisplaySize:(w:number,h:number)=>{data.size=[w,h];return image;},
      setTintFill:(color:number)=>{data.tint=color;return image;},setAlpha:(alpha:number)=>{data.alpha=alpha;return image;}};
    return image;
  },container:(x:number,y:number)=>{
    const data:typeof objects[number]={x,y};objects.push(data);
    const object={setDepth:(depth:number)=>{data.depth=depth;return object;},setName:()=>object,setVisible:(visible:boolean)=>{data.visible=visible;return object;}};
    return object;
  }}} as unknown as Phaser.Scene;
  const state=createState(LEVELS[1]),plan=planDecor(state),decor=new CityDecor(scene,state);
  expect(objects).toHaveLength(6);
  for(let i=0;i<plan.length;i++) {
    expect(images[i*2]).toMatchObject({origin:[.5,1],size:[48,48]});
    expect(images[i*2+1]).toMatchObject({x:6,y:4,origin:[.5,1],size:[48,48],tint:0x0b1320,alpha:.35});
    const p=tileCenter(plan[i].x,plan[i].y);
    expect(objects[i]).toMatchObject({x:p.x+plan[i].offsetX,y:p.y+34,depth:worldDepth(p.y+34),visible:true});
  }
  decor.update(state,[plan[0]]);expect(objects[0].visible).toBe(false);
  decor.update(state);expect(objects[0].visible).toBe(true);
  const after=placeTool(state,plan[0].x,plan[0].y,'tree').state;
  decor.update(after);expect(objects[0].visible).toBe(false);
  decor.update(state);expect(objects[0].visible).toBe(true);
});
