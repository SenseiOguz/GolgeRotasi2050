import type Phaser from 'phaser';
import { expect, test } from 'vitest';
import { Simulation } from '../../src/gameplay/Simulation';
import { computeRun, createState } from '../../src/core/rules';
import { LEVELS } from '../../src/core/levels';
import { tileCenter } from '../../src/ui/layout';
type StepTween = { x: number; y: number; duration: number; onComplete: () => void; onUpdate: (tween: Phaser.Tweens.Tween) => void };
function harness() {
  let removed = 0;
  const completions: (() => void)[] = [];
  const destinations: StepTween[] = [];
  const scene = { tweens: { add: (config: StepTween) => {
    destinations.push(config);
    completions.push(config.onComplete);
    return { remove: () => removed++ };
  } } } as unknown as Phaser.Scene;
  return { completions, destinations, removed: () => removed, simulation: new Simulation(scene) };
}
test('plays each core sample once in order, then completes with consistent cumulative load', () => {
  const { completions, destinations, simulation } = harness();
  const result = computeRun(createState(LEVELS[1]));
  const seen: number[] = [];
  let finished = 0;
  simulation.play({} as Phaser.GameObjects.Container, result, step => seen.push(step.cumulativeLoad), () => finished++);
  expect(seen).toEqual([]);
  while (completions.length) completions.shift()!();
  expect(seen).toEqual(result.steps.map(step => step.cumulativeLoad));
  expect(seen.at(-1)).toBe(result.totalLoad);
  expect(destinations).toHaveLength(result.steps.length);
  expect(destinations.every(destination => destination.duration === 300)).toBe(true);
  expect(finished).toBe(1);
});
test('shutdown cancellation prevents late steps and completion callbacks', () => {
  const { completions, simulation, removed } = harness();
  let callbacks = 0;
  simulation.play({} as Phaser.GameObjects.Container, computeRun(createState(LEVELS[1])), () => callbacks++, () => callbacks++);
  simulation.cancel();
  expect(removed()).toBe(1);
  completions.shift()!();
  expect(callbacks).toBe(0);
  expect(completions).toEqual([]);
});

test('walking faces the route turn, bobs subtly, and lands exactly on tile centers', () => {
  const { completions, destinations, simulation } = harness();
  const heading = { rotation: 0 };
  const courier = { ...tileCenter(0, 2), getByName: () => heading } as unknown as Phaser.GameObjects.Container;
  simulation.play(courier, computeRun(createState(LEVELS[1])), () => {}, () => {});
  for (let i = 0; i < 6; i++) completions.shift()!();
  expect(heading.rotation).toBeCloseTo(Math.PI / 2);
  const turn = destinations[6];
  turn.onUpdate({ progress: 0.25 } as Phaser.Tweens.Tween);
  expect(courier.y).toBeGreaterThan(tileCenter(5, 2).y);
  expect(courier.y).toBeLessThan(tileCenter(5, 3).y);
  completions.shift()!();
  expect({ x: courier.x, y: courier.y }).toEqual(tileCenter(5, 3));
});
test('motion hooks follow each real sample and update during tween movement', () => {
  const { completions, destinations, simulation } = harness();
  const courier = {...tileCenter(0,2)} as Phaser.GameObjects.Container;
  const moves:number[][]=[], progress:number[]=[];let idles=0;
  simulation.play(courier,computeRun(createState(LEVELS[1])),()=>{},()=>{}, {move:(dx,dy)=>moves.push([dx,dy]),update:p=>progress.push(p),idle:()=>idles++});
  expect(moves[0]).toEqual([0,0]);
  completions.shift()!();
  expect(moves[1]).toEqual([80,0]);
  destinations[1].onUpdate({progress:.5} as Phaser.Tweens.Tween);
  expect(progress).toEqual([.5]);
  while(completions.length) completions.shift()!();
  expect(moves).toContainEqual([0,80]);
  expect(idles).toBe(computeRun(createState(LEVELS[1])).steps.length);
});
