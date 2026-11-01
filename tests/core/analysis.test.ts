import { expect, test } from 'vitest';
import { enumeratePlans } from '../../src/core/analysis';
import { canPlace, computeRun, createState, placeTool } from '../../src/core/rules';
import { computeStars } from '../../src/core/score';
import type { GameState, LevelData } from '../../src/core/types';

const level: LevelData = {
  id: 'tiny', name: 'Tiny', cols: 4, rows: 1, tiles: [['road', 'road', 'road', 'road']],
  baseHeat: [[80, 90, 95, 70]], route: [0, 1, 2, 3].map(x => ({ x, y: 0 })),
  budget: 80, heatThreshold: 290, tools: ['tree', 'canopy'],
  blockedCells: [{ x: 2, y: 0 }], toolLimits: { canopy: 1 },
  heatWave: { fromStep: 1, toStep: 2, bonus: 25 },
  stars: { margin2: 0, margin3: .01, savings: 0, eff2: 0, eff3: 0 },
};
test('analysis agrees with independent exhaustive placement search with hazards and limits', () => {
  const snapshot = structuredClone(level);
  const baseline = computeRun(createState(level)).totalLoad;
  const counts = [0, 0, 0, 0];
  let best = Infinity;
  function visit(state: GameState, x: number): void {
    if (x === level.cols) {
      const result = computeRun(state);
      counts[computeStars(level, result, baseline).stars]++;
      best = Math.min(best, result.totalLoad);
      return;
    }
    visit(state, x + 1);
    for (const tool of level.tools) if (canPlace(state, x, 0, tool).ok) visit(placeTool(state, x, 0, tool).state, x + 1);
  }
  visit(createState(level), 0);
  const analysis = enumeratePlans(level);
  expect(analysis.counts).toEqual(counts);
  expect(analysis.total).toBe(counts.reduce((a, b) => a + b, 0));
  expect(analysis.bestLoad).toBe(best);
  expect(analysis.winning).toBe(counts[1] + counts[2] + counts[3]);
  expect(analysis.threeStar).toBe(counts[3]);
  for (const plan of [analysis.bestPlan, analysis.winningPlan!, analysis.threeStarPlan!]) {
    let state = createState(level);
    for (const p of plan) {
      expect(canPlace(state, p.x, p.y, p.tool).ok).toBe(true);
      state = placeTool(state, p.x, p.y, p.tool).state;
    }
    expect(computeRun(state).success).toBe(true);
  }
  expect(level).toEqual(snapshot);
  expect(enumeratePlans(level)).toEqual(analysis);
});
test('bounded search and impossible levels include the empty plan safely', () => {
  const result = enumeratePlans({ ...level, heatThreshold: 0 }, { maxPlacements: 0 });
  expect(result).toMatchObject({ total: 1, counts: [1, 0, 0, 0], winning: 0, threeStar: 0, winningPlan: null, threeStarPlan: null, bestPlan: [] });
});
