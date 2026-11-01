import { expect, it, vi } from 'vitest';
import { GameScene } from '../../src/scenes/GameScene';
import { LEVELS } from '../../src/core/levels';
import { createState, computeRun } from '../../src/core/rules';
import { computeStars } from '../../src/core/score';

const mocks=vi.hoisted(()=>({
  recordResult:vi.fn(),setLastPlayed:vi.fn(),nextId:vi.fn(),isUnlocked:vi.fn(),
  listeners:new Map<string,(payload?: unknown)=>void>(),finish:undefined as undefined | (()=>void),
}));
vi.mock('phaser',()=>({default:{Scene:class {},Scenes:{Events:{SHUTDOWN:'shutdown',CREATE:'create'}}}}));
vi.mock('../../src/core/GameEvents',()=>({
  GameEvent:Object.fromEntries(['SIM_START_REQUESTED','SIM_STARTED','SIM_FINISHED','SIM_STEP','TOOL_SELECTED','HEATMAP_TOGGLED','UNDO_REQUESTED','RETRY_REQUESTED','NEXT_LEVEL_REQUESTED','MAP_REQUESTED','MUTE_TOGGLED'].map(k=>[k,k])),
  emitEvent:vi.fn(),offEvent:vi.fn(),onEvent:(key:string,fn:(payload?:unknown)=>void)=>mocks.listeners.set(key,fn),
}));
vi.mock('../../src/core/levelManager',()=>({createLevelManager:()=>mocks}));
vi.mock('../../src/gameplay/Simulation',()=>({Simulation:class {play(_courier:unknown,_result:unknown,_step:unknown,finish:()=>void){mocks.finish=finish;} cancel(){}}}));
vi.mock('../../src/gameplay/fx',()=>({ripple:vi.fn(),floatingHeat:vi.fn(),finishEffect:vi.fn(),stepFeedback:vi.fn()}));
vi.mock('../../src/gameplay/renderAdapter',()=>({}));
vi.mock('../../src/assets/pixelManifest',()=>({PIXEL_ASSETS:[]}));
vi.mock('../../src/assets/sfx',()=>({sfx:{muted:false}}));

function harness() {
  const scene=new GameScene();
  const callbacks:(()=>void)[]=[];
  const restart=vi.fn(),start=vi.fn(),stop=vi.fn();
  const chain={clear:vi.fn(),setVisible:vi.fn()};
  Object.assign(scene,{
    state:createState(LEVELS[0]),courier:{setVisible:vi.fn()},hover:chain,previewText:chain,
    scene:{restart,start,stop,manager:{keys:{}},get:()=>({events:{once:vi.fn()}}),isActive:()=>true},
    cameras:{main:{setBackgroundColor:vi.fn()}},registry:{get:()=>[]},
    input:{on:vi.fn(),keyboard:{on:vi.fn()}},events:{once:vi.fn()},
    time:{delayedCall:(_ms:number,fn:()=>void)=>callbacks.push(fn)},
    tweens:{add:vi.fn()},
  });
  return {scene:scene as unknown as {create(data?:{levelId?:string}):void;startRun():void;state:ReturnType<typeof createState>;drawGrid():void},callbacks,restart,start,stop};
}

it('records the current level and computed stars exactly once even if completion repeats',()=>{
  mocks.recordResult.mockClear();
  const h=harness();
  h.scene.startRun();
  mocks.finish!();
  const complete=h.callbacks.pop()!;
  complete();complete();
  const result=computeRun(createState(LEVELS[0]));
  expect(mocks.recordResult).toHaveBeenCalledExactlyOnceWith(LEVELS[0].id,false,computeStars(LEVELS[0],result,result.totalLoad).stars,result.totalLoad);
});

it('loads scene data, resets retry to that level and only advances to unlocked successors',()=>{
  const h=harness();
  h.scene.drawGrid=vi.fn();
  h.scene.create({levelId:LEVELS[2].id});
  expect(h.scene.state.level.id).toBe(LEVELS[2].id);
  mocks.listeners.get('RETRY_REQUESTED')!();
  expect(h.restart).toHaveBeenLastCalledWith({levelId:LEVELS[2].id});
  mocks.nextId.mockReturnValue(LEVELS[3].id);
  mocks.isUnlocked.mockReturnValue(false);
  h.scene.state.phase='result';
  mocks.listeners.get('NEXT_LEVEL_REQUESTED')!();
  expect(h.restart).toHaveBeenCalledTimes(1);
  mocks.isUnlocked.mockReturnValue(true);
  mocks.listeners.get('NEXT_LEVEL_REQUESTED')!();
  expect(h.restart).toHaveBeenLastCalledWith({levelId:LEVELS[3].id});
  mocks.listeners.get('MAP_REQUESTED')!();
  expect(h.stop).toHaveBeenCalledWith('UIScene');
  expect(h.start).toHaveBeenCalledWith('MenuScene');
});
