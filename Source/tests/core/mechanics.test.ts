import { expect, test } from 'vitest';
import { LEVELS, getLevel } from '../../src/core/levels';
import { canPlace, computeRun, createState, placeTool, removeTool } from '../../src/core/rules';
import { computeStars } from '../../src/core/score';

const level = getLevel('yogun-mahalle') ?? LEVELS[0];
test('blocked cells reject placement without changing state', () => {
  const state = createState({ ...level, blockedCells: [{ x: 2, y: 2 }] });
  expect(canPlace(state, 2, 2, 'tree')).toEqual({ ok: false, reason: 'blocked' });
  expect(placeTool(state, 2, 2, 'canopy')).toEqual({ state, result: { ok: false, reason: 'blocked' } });
  expect(canPlace(state, 1, 2, 'canopy')).toEqual({ ok: true });
});
test('limits count current placements per tool and removal restores capacity', () => {
  const base = createState({ ...level, toolLimits: { tree: 1, coolRoof: 0 } });
  expect(canPlace(base, 0, 0, 'coolRoof')).toEqual({ ok: false, reason: 'limit' });
  const state = placeTool(base, 2, 2, 'tree').state;
  expect(canPlace(state, 3, 2, 'tree')).toEqual({ ok: false, reason: 'limit' });
  expect(canPlace(state, 3, 2, 'canopy')).toEqual({ ok: true });
  expect(canPlace(removeTool(state, 2, 2), 3, 2, 'tree')).toEqual({ ok: true });
});
test('heat wave uses inclusive zero-based route indices after cooling, before sum and peak', () => {
  const state = placeTool(createState({ ...level, heatWave: { fromStep: 1, toStep: 2, bonus: 70 } }), 2, 2, 'canopy').state;
  const before = structuredClone(state), result = computeRun(state);
  expect(result.steps.map(step => step.heat).slice(0, 4)).toEqual([58, 100, 100, 92]);
  expect(result.totalLoad).toBe(1042);
  expect(result.steps[2].cumulativeLoad).toBe(258);
  expect(result.peakHeat).toBe(100);
  expect(state).toEqual(before);
  expect(computeRun(state)).toEqual(result);
  const cold = computeRun(createState({ ...level, heatWave: { fromStep: 0, toStep: 0, bonus: -100 } }));
  expect(cold.steps[0].heat).toBe(0);
  expect(cold.totalLoad).toBe(938);
});
test('delivery markers never affect simulation heat', () => {
  expect(computeRun(createState({ ...level, deliveries: level.route.slice(1, 4) }))).toEqual(computeRun(createState(level)));
});
test('custom stars replace every threshold and use fractional savings rounded up', () => {
  const result = { ...computeRun(createState(level)), success: true, totalLoad: 700, budgetLeft: 5, budgetSpent: 175 };
  const custom = { ...level, stars: { margin2: .01, margin3: .04, savings: .025, eff2: 1, eff3: 1.6 } };
  const score = computeStars(custom, result, 996);
  expect(score.stars).toBe(3);
  expect(score.criteria.budgetLeft.targets).toEqual({ two: 5, three: 5 });
  expect(computeStars({ ...custom, stars: { ...custom.stars, savings: .03 } }, result, 996).stars).toBe(1);
  expect(computeStars({ ...custom, stars: { ...custom.stars, margin3: .1 } }, result, 996).stars).toBe(2);
  expect(computeStars({ ...custom, stars: { ...custom.stars, eff3: 2 } }, result, 996).stars).toBe(2);
  expect(computeStars(custom, { ...result, success: false }, 996).stars).toBe(0);
});

test('default and custom star explanations preserve Turkish UTF-8 text', () => {
  const result = computeRun(createState(level));
  for (const stars of [undefined, { margin2: .01, margin3: .04, savings: .025, eff2: 1, eff3: 1.6 }]) {
    const { criteria } = computeStars({ ...level, stars }, result, result.totalLoad);
    expect(criteria.margin.explanation).toContain('Isı eşiğinin altında pay bırak');
    expect(criteria.budgetLeft.explanation).toContain('Bütçenin en az');
    expect(criteria.budgetLeft.explanation).toContain('yukarı yuvarlanır');
    expect(criteria.efficiency.explanation).toContain('başına ısı azaltımı');
    for (const { explanation } of Object.values(criteria)) {
      expect(explanation).not.toMatch(/[?\uFFFD]/u);
    }
    const text = Object.values(criteria).map(c => c.explanation).join(' ');
    for (const letter of ['ı', 'ş', 'ğ', 'ü', 'ç']) expect(text).toContain(letter);
  }
});
