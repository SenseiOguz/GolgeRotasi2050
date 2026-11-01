import { describe, expect, test } from 'vitest';
import { LEVELS, getLevel } from '../../src/core/levels';
import { TOOLS } from '../../src/core/tools';
import { EDU_CARDS } from '../../src/core/eduCards';
import { canPlace, computeHeat, computeRun, createState, heatToColor, placeTool, removeTool } from '../../src/core/rules';
import type { GameState, ToolId } from '../../src/core/types';

const level = getLevel('yogun-mahalle') ?? LEVELS[0];
const moves: [number, number, ToolId][] = [
  [2, 2, 'tree'], [4, 2, 'tree'], [5, 4, 'tree'], [5, 3, 'canopy'], [7, 4, 'canopy'],
];
function play(sequence = moves): GameState {
  return sequence.reduce((state, [x, y, tool]) => {
    const placement = placeTool(state, x, y, tool);
    expect(placement.result).toEqual({ ok: true });
    return placement.state;
  }, createState(level));
}

describe('level and balance', () => {
  test('catalog has a valid contiguous start-to-goal road route and educational cards', () => {
    expect(getLevel(level.id)).toBe(level);
    expect(getLevel('missing')).toBeUndefined();
    expect(level.tiles).toHaveLength(6);
    level.tiles.forEach((row, y) => {
      expect(row).toHaveLength(10);
      expect(level.baseHeat[y]).toHaveLength(10);
      level.baseHeat[y].forEach(heat => expect(heat).toBeGreaterThanOrEqual(0));
      level.baseHeat[y].forEach(heat => expect(heat).toBeLessThanOrEqual(100));
    });
    level.route.forEach(({ x, y }, i) => {
      expect(level.tiles[y][x]).toBe(i === 0 ? 'start' : i === level.route.length - 1 ? 'goal' : 'road');
      if (i) expect(Math.abs(x - level.route[i - 1].x) + Math.abs(y - level.route[i - 1].y)).toBe(1);
    });
    expect(level.eduCardIds?.every(id => EDU_CARDS.some(card => card.id === id))).toBe(true);
  });
  test('initial state is independent and doing nothing fails', () => {
    const state = createState(level);
    expect(state).toMatchObject({ budgetLeft: 180, selectedTool: null, muted: false, phase: 'planning' });
    expect(computeRun(state)).toMatchObject({ success: false, totalLoad: 996, peakHeat: 96, budgetSpent: 0 });
    state.level.baseHeat[0][0] = 0;
    expect(level.baseHeat[0][0]).toBe(78);
  });
  test('known mixed solution wins within budget; same moves are deterministic', () => {
    const first = play();
    expect(first).toEqual(play());
    const result = computeRun(first);
    expect(result).toEqual(computeRun(play()));
    expect(result).toMatchObject({ success: true, totalLoad: 732, budgetSpent: 170, budgetLeft: 10 });
    expect(result.steps.at(-1)?.cumulativeLoad).toBe(result.totalLoad);
    expect(result.peakHeat).toBe(Math.max(...result.steps.map(step => step.heat)));
    expect(computeRun({ ...first, level: { ...first.level, heatThreshold: 732 } }).success).toBe(true);
    expect(computeRun({ ...first, level: { ...first.level, heatThreshold: 731 } }).success).toBe(false);
  });
  test('spending the entire budget on roofs far from the route fails', () => {
    const state = play([0, 1, 2, 4, 5, 6].map(x => [x, 0, 'coolRoof']));
    expect(computeRun(state)).toMatchObject({ success: false, totalLoad: 996, budgetLeft: 0 });
  });
});

describe('placement and immutable removal', () => {
  test.each([[0, 2], [9, 4], [7, 0], [0, 0], [-1, 2], [10, 2], [1.5, 2], [1, NaN]])('rejects invalid tree target (%s,%s)', (x, y) => {
    const state = createState(level);
    expect(placeTool(state, x, y, 'tree')).toEqual({ state, result: { ok: false, reason: 'invalid_tile' } });
  });
  test('all tools respect their allowed surfaces and special tiles', () => {
    const state = createState(level);
    for (const row of state.tiles) for (const tile of row) for (const tool of Object.values(TOOLS)) {
      expect(canPlace(state, tile.x, tile.y, tool.id).ok).toBe(tool.allowedOn.includes(tile.type));
    }
  });
  test('rejects missing tools, occupied cells, insufficient budget and non-planning edits', () => {
    const state = createState(level);
    expect(canPlace(state, 1, 2, null)).toEqual({ ok: false, reason: 'no_tool' });
    expect(canPlace({ ...state, level: { ...state.level, tools: [] } }, 1, 2, 'tree')).toEqual({ ok: false, reason: 'no_tool' });
    const occupied = placeTool(state, 1, 2, 'tree').state;
    expect(canPlace(occupied, 1, 2, 'canopy')).toEqual({ ok: false, reason: 'occupied' });
    expect(canPlace({ ...state, budgetLeft: 24 }, 1, 2, 'canopy')).toEqual({ ok: false, reason: 'no_budget' });
    expect(canPlace({ ...state, phase: 'simulating' }, 1, 2, 'tree')).toEqual({ ok: false, reason: 'invalid_tile' });
  });
  test('placement and full-refund removal preserve previous snapshots and reset heat', () => {
    const state = createState(level);
    const before = structuredClone(state);
    const placed = placeTool(state, 2, 2, 'tree').state;
    const snapshot = structuredClone(placed);
    expect(state).toEqual(before);
    expect(removeTool(placed, 2, 2)).toEqual(state);
    expect(placed).toEqual(snapshot);
    expect(removeTool(state, 2, 2)).toBe(state);
    expect(removeTool(state, -1, 2)).toBe(state);
    expect(removeTool({ ...placed, phase: 'result' }, 2, 2).budgetLeft).toBe(140);
  });
  test('budget never becomes negative after repeated attempts', () => {
    let state = createState(level);
    for (let i = 0; i < 3; i++) for (const row of level.tiles) for (let x = 0; x < row.length; x++) {
      const y = level.tiles.indexOf(row);
      for (const tool of level.tools) {
        state = placeTool(state, x, y, tool).state;
        expect(state.budgetLeft).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('heat and color', () => {
  test('cooling is additive, orthogonal only, fresh, and recalculated from baseHeat', () => {
    const state = createState(level);
    const tiles = placeTool(state, 2, 2, 'tree').state.tiles;
    expect(tiles[2][2].heat).toBe(82 - 32);
    expect(tiles[2][1].heat).toBe(72 - 14);
    expect(tiles[1][1].heat).toBe(78);
    expect(computeHeat(tiles)).toEqual(tiles);
    const two = placeTool({ ...state, tiles }, 4, 2, 'tree').state;
    expect(two.tiles[2][3].heat).toBe(92 - 28);
    expect(computeRun({ ...two, tiles: two.tiles.map(row => row.map(tile => ({ ...tile, heat: 0 }))) })).toEqual(computeRun(two));
  });
  test('heat clamps both bounds even with overlapping cooling', () => {
    const tiles = createState(level).tiles;
    tiles[2][2] = { ...tiles[2][2], baseHeat: 1, placed: 'tree' };
    tiles[2][1] = { ...tiles[2][1], baseHeat: 500 };
    const before = structuredClone(tiles);
    const cooled = computeHeat(tiles);
    expect(cooled[2][2].heat).toBe(0);
    expect(cooled[2][1].heat).toBe(100);
    expect(tiles).toEqual(before);
  });
  test('color endpoints, midpoint, interpolation and clamping', () => {
    expect(heatToColor(-10)).toBe(0x43c6a5);
    expect(heatToColor(0)).toBe(0x43c6a5);
    expect(heatToColor(25)).toBe(0x9ac581);
    expect(heatToColor(50)).toBe(0xf0c35c);
    expect(heatToColor(100)).toBe(0xf87852);
    expect(heatToColor(110)).toBe(0xf87852);
  });
});
