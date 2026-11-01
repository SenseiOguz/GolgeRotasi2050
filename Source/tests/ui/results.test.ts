import { expect, test } from 'vitest';
import { getLevel, LEVELS } from '../../src/core/levels';
import { computeRun, createState, placeTool } from '../../src/core/rules';
import { ResultTracker, failureHint } from '../../src/ui/resultData';
import type { ToolId } from '../../src/core/types';

test('result summary uses real initial/final heat, budget, and interventions', () => {
  const tracker = new ResultTracker(); const level = (getLevel('yogun-mahalle') ?? LEVELS[0]); tracker.reset(level);
  let state = createState(level);
  const moves: [number, number, ToolId][] = [[2, 2, 'tree'], [4, 2, 'tree'], [5, 4, 'tree'], [5, 3, 'canopy'], [7, 4, 'canopy']];
  for (const [x, y, tool] of moves) { state = placeTool(state, x, y, tool).state; tracker.placed(x, y, tool); tracker.heatUpdated(state.tiles); }
  const result = computeRun(state), before = structuredClone(state);
  const summary = tracker.summary(result)!;
  expect(summary).toMatchObject({ initialLoad: 996, finalLoad: 732, budgetLeft: 10, budgetSpent: 170, counts: { tree: 3, canopy: 2, coolRoof: 0 } });
  expect(summary.finalTiles).toEqual(state.tiles); expect(summary.initialTiles).toEqual(createState(level).tiles);
  summary.finalTiles[0][0].heat = 0; expect(state).toEqual(before);
  expect(summary.hottest.map(step => step.heat)).toEqual([...result.steps].map(step => step.heat).sort((a, b) => b - a).slice(0, 3));
});

test('authoritative heat snapshots undo placements and reset cleanly on retry', () => {
  const tracker = new ResultTracker(), level = (getLevel('yogun-mahalle') ?? LEVELS[0]), initial = createState(level); tracker.reset(level);
  tracker.placed(2, 2, 'tree'); tracker.heatUpdated(placeTool(initial, 2, 2, 'tree').state.tiles);
  expect(tracker.summary(computeRun(initial))!.counts.tree).toBe(1);
  tracker.heatUpdated(initial.tiles); // The snapshot published by the game after UNDO_REQUESTED.
  expect(tracker.summary(computeRun(initial))!.counts.tree).toBe(0);
  tracker.placed(2, 2, 'tree'); tracker.reset(level);
  expect(tracker.summary(computeRun(initial))).toMatchObject({ initialLoad: 996, finalLoad: 996, counts: { tree: 0, canopy: 0, coolRoof: 0 } });
});

test('empty placement failure recommends adding shade without inventing an undo', () => {
  const level = (getLevel('yogun-mahalle') ?? LEVELS[0]), state = createState(level), tracker = new ResultTracker(); tracker.reset(level);
  const hint = failureHint(level, tracker.summary(computeRun(state))!);
  expect(hint).toContain('ağaç veya gölgelik'); expect(hint).not.toContain('geri al');
});

test('useful route placement does not get a misleading far-intervention undo hint', () => {
  const level = (getLevel('yogun-mahalle') ?? LEVELS[0]), tracker = new ResultTracker(); tracker.reset(level);
  const state = placeTool(createState(level), 5, 3, 'canopy').state; tracker.heatUpdated(state.tiles);
  expect(failureHint(level, tracker.summary(computeRun(state))!)).not.toContain('geri al');
});

test('a paid intervention with no route cooling can be suggested for undo', () => {
  const level = (getLevel('yogun-mahalle') ?? LEVELS[0]), tracker = new ResultTracker(); tracker.reset(level);
  const state = placeTool(createState(level), 0, 0, 'coolRoof').state; tracker.heatUpdated(state.tiles);
  expect(failureHint(level, tracker.summary(computeRun(state))!)).toContain('geri al');
});
