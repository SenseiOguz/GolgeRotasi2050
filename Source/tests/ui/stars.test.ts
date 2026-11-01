import { expect, test } from 'vitest';
import { getLevel, LEVELS } from '../../src/core/levels';
import { computeRun, createState, placeTool } from '../../src/core/rules';
import { computeStars } from '../../src/core/score';
import type { ToolId } from '../../src/core/types';
import { starDisplay } from '../../src/ui/starDisplay';
const level = (getLevel('yogun-mahalle') ?? LEVELS[0]);
const run = (moves: [number, number, ToolId][]) => { let state = createState(level); for (const [x, y, tool] of moves) state = placeTool(state, x, y, tool).state; return computeRun(state); };

test('reference win maps to one full icon, two empty icons and next-tier criteria', () => {
  const result = run([[2,2,'tree'],[4,2,'tree'],[5,4,'tree'],[5,3,'canopy'],[7,4,'canopy']]);
  const snapshot = structuredClone(result), display = starDisplay(level, result);
  expect(result.totalLoad).toBe(732); expect(display.stars).toBe(1); expect(display.slots).toEqual([true, false, false]);
  expect(display.criteria.map(row => row.passed)).toEqual([false, true, false]);
  expect(display.motivation).toContain('Bir yıldız daha için:'); expect(display.motivation).toContain('%1,5');
  expect(display.motivation).toContain('1,60');
  const score = computeStars(level, result, computeRun(createState(level)).totalLoad);
  for (const row of display.criteria) expect(row.explanation).toBe(score.criteria[row.key].explanation);
  expect(result).toEqual(snapshot);
});

test('two stars show two icons and evaluate the third-star targets', () => {
  const display = starDisplay(level, run([[5,2,'tree'],[1,2,'canopy'],[2,2,'canopy'],[3,2,'canopy'],[4,2,'canopy'],[5,3,'canopy']]));
  expect(display.stars).toBe(2); expect(display.slots).toEqual([true, true, false]);
  expect(display.criteria.find(row => row.key === 'margin')?.target).toBe(.05);
  expect(display.motivation).toContain('%5,0');
});

test('seven-canopy plan maps 702/740 to three filled stars and all passing criteria', () => {
  const plan: [number, number, ToolId][] = [[1,2,'canopy'],[2,2,'canopy'],[3,2,'canopy'],[4,2,'canopy'],[5,2,'canopy'],[5,3,'canopy'],[5,4,'canopy']];
  const result = run(plan), display = starDisplay(level, result);
  expect(result.totalLoad).toBe(702); expect(display.stars).toBe(3); expect(display.slots).toEqual([true, true, true]);
  expect(display.criteria.every(row => row.passed)).toBe(true);
  expect(display.motivation).toBe('Üç yıldız tamam! Farklı müdahale kombinasyonlarıyla da dene.');
});

test('failure has no star slots, criterion panel or next-star motivation', () => {
  const result = run([]), display = starDisplay(level, result);
  expect(result.totalLoad).toBe(996); expect(display.stars).toBe(0); expect(display.slots).toEqual([]); expect(display.criteria).toEqual([]); expect(display.motivation).toBe('');
});
