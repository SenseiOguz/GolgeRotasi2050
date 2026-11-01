import { expect, test } from 'vitest';
import { LEVELS } from '../../src/core/levels';
import { createState, placeTool, computeRun } from '../../src/core/rules';
import { affectedArea, projectedReduction, heatAlpha } from '../../src/gameplay/preview';
test('cooling footprint follows tool neighbor cooling and clips at grid edges', () => {
  const state = createState(LEVELS[1]);
  expect(affectedArea(state, 2, 2, 'tree')).toEqual([{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 1 }]);
  expect(affectedArea(state, 0, 0, 'coolRoof')).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]);
  expect(affectedArea(state, 5, 3, 'canopy')).toEqual([{ x: 5, y: 3 }]);
});
test('projection uses rules without mutating state and refuses invalid placements', () => {
  const state = createState(LEVELS[1]);
  const snapshot = structuredClone(state);
  expect(projectedReduction(state, 2, 2, 'tree')).toBe(60);
  expect(projectedReduction(state, 0, 0, 'tree')).toBeUndefined();
  expect(projectedReduction(placeTool(state, 2, 2, 'tree').state, 2, 2, 'tree')).toBeUndefined();
  expect(state).toEqual(snapshot);
  let winning = state;
  for (const [x, y] of [[2, 2], [4, 2], [5, 4]]) winning = placeTool(winning, x, y, 'tree').state;
  for (const [x, y] of [[5, 3], [7, 4]]) winning = placeTool(winning, x, y, 'canopy').state;
  expect(computeRun(winning).totalLoad).toBe(732);
  expect(computeRun(state).totalLoad).toBe(996);
  expect(projectedReduction({ ...state, budgetLeft: 0 }, 2, 2, 'tree')).toBeUndefined();
});
test('heat alpha is bounded and clearly stronger at the hot end', () => {
  expect(heatAlpha(-10)).toBe(heatAlpha(0));
  expect(heatAlpha(110)).toBe(heatAlpha(100));
  expect(heatAlpha(90) - heatAlpha(20)).toBeGreaterThan(0.2);
});
