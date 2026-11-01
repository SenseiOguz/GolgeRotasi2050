import { expect,it,vi } from 'vitest';
import type Phaser from 'phaser';
import { cappedEffect } from '../../src/gameplay/fx';
vi.mock('phaser',()=>({default:{GameObjects:{Events:{DESTROY:'destroy'}}}}));

it('shares the 150 effect cap and releases capacity when scene objects are destroyed',()=>{
  const scene={} as Phaser.Scene;
  const destroyers:(()=>void)[]=[];
  const create=vi.fn(()=>({once:(event:string,callback:()=>void)=>{
    expect(event).toBe('destroy');destroyers.push(callback);
  }}) as unknown as Phaser.GameObjects.GameObject);
  for(let i=0;i<150;i++) expect(cappedEffect(scene,create)).toBeDefined();
  expect(cappedEffect(scene,create)).toBeUndefined();
  expect(create).toHaveBeenCalledTimes(150);
  destroyers.shift()!();
  expect(cappedEffect(scene,create)).toBeDefined();
  expect(cappedEffect(scene,create)).toBeUndefined();
  for(const destroy of destroyers) destroy();
  expect(cappedEffect(scene,create)).toBeDefined();
});
