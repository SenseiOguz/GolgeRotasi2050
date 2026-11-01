import { beforeEach,expect,it,vi } from 'vitest';
import type Phaser from 'phaser';
import { LevelAtmosphere } from '../../src/gameplay/LevelAtmosphere';
import { deliveryFlight,heatWaveCue } from '../../src/gameplay/polishFx';
import { LEVELS } from '../../src/core/levels';
import { createState } from '../../src/core/rules';

const motion=vi.hoisted(()=>({reduced:true}));
vi.mock('../../src/ui/pixel',()=>({reducedMotion:()=>motion.reduced}));
vi.mock('../../src/gameplay/fx',()=>({particle:vi.fn(),cappedEffect:vi.fn()}));
vi.mock('../../src/gameplay/BuildingVisual',()=>({availablePixel:vi.fn(()=> 'loaded-icon')}));
import { particle,cappedEffect } from '../../src/gameplay/fx';

beforeEach(()=>{motion.reduced=true;vi.clearAllMocks();});
it.each([0,2,3])('spawns no atmosphere, heat shimmer, parcel or edge effects with reduced motion (level %s)',index=>{
  // An empty scene deliberately cannot create objects or tweens.
  const scene={} as Phaser.Scene;
  const atmosphere=new LevelAtmosphere(scene,createState(LEVELS[index]));
  atmosphere.heatStep(200,200,95);
  deliveryFlight(scene,200,200,110,116);
  heatWaveCue(scene,200,200);
  expect(particle).not.toHaveBeenCalled();
  expect(cappedEffect).not.toHaveBeenCalled();
});
it('keeps effects available when the shared preference allows motion',()=>{
  motion.reduced=false;
  const scene={} as Phaser.Scene;
  new LevelAtmosphere(scene,createState(LEVELS[0]));
  deliveryFlight(scene,200,200,110,116);
  heatWaveCue(scene,200,200);
  expect(particle).toHaveBeenCalledTimes(4);
  expect(cappedEffect).toHaveBeenCalledTimes(3);
});
