import { expect, test } from 'vitest';
import { LevelManager } from '../../src/core/levelManager';
import { getLevel, LEVELS } from '../../src/core/levels';
import { computeRun, createState, placeTool } from '../../src/core/rules';
import { mechanicStatus, nextPlayable, planningLoad, toolCounts } from '../../src/ui/levelHUD';
test('next action requires a successful run and an unlocked successor', () => {
  const levels = [{ ...(getLevel('yogun-mahalle') ?? LEVELS[0]), id: 'a' }, { ...(getLevel('yogun-mahalle') ?? LEVELS[0]), id: 'b' }];
  const manager = new LevelManager(levels);
  expect(nextPlayable(manager, 'a', true)).toBeNull();
  manager.recordResult('a', true, 2, 20);
  expect(nextPlayable(manager, 'a', true)).toBe('b');
  expect(nextPlayable(manager, 'a', false)).toBeNull();
  expect(nextPlayable(manager, 'b', true)).toBeNull();
});
test('placement snapshots restore tool counts after undo', () => {
  const initial = createState((getLevel('yogun-mahalle') ?? LEVELS[0]));
  const placed = placeTool(initial, 2, 2, 'tree').state;
  expect(toolCounts(placed.tiles).tree).toBe(1);
  expect(toolCounts(initial.tiles).tree).toBe(0);
});
test('mechanic indicators use route steps and inclusive heat-wave bounds', () => {
  const level = { ...(getLevel('yogun-mahalle') ?? LEVELS[0]), deliveries: [(getLevel('yogun-mahalle') ?? LEVELS[0]).route[0], (getLevel('yogun-mahalle') ?? LEVELS[0]).route[2]], heatWave: { fromStep: 1, toStep: 2, bonus: 12 } };
  expect(mechanicStatus(level)).toContain('0/2');
  expect(mechanicStatus(level, { ...level.route[2], index: 2, heat: 30, cumulativeLoad: 70 })).toBe('Teslimatlar 2/2   ·   ISI DALGASI · +12 ısı');
  expect(mechanicStatus({ ...(getLevel('yogun-mahalle') ?? LEVELS[0]), deliveries: undefined, heatWave: undefined })).toBe('');
});
test('planning load uses the active route and heat-wave rule', () => {
  const level = { ...(getLevel('yogun-mahalle') ?? LEVELS[0]), cols: 1, rows: 1, tiles: [['road' as const]], baseHeat: [[30]], route: [{ x: 0, y: 0 }], heatWave: { fromStep: 0, toStep: 0, bonus: 12 } };
  expect(planningLoad(level, createState(level).tiles)).toBe(computeRun(createState(level)).totalLoad);
  expect(planningLoad({ ...level, heatWave: undefined })).toBe(30);
});
