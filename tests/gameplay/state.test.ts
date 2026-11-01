import { describe, expect, test } from 'vitest';
import { gridCell, tileCenter } from '../../src/ui/layout';
import { UndoHistory } from '../../src/gameplay/UndoHistory';
import { createState, placeTool } from '../../src/core/rules';
import { LEVELS } from '../../src/core/levels';
describe('grid input mapping', () => {
  test('exact bounds and tile centers agree', () => {
    expect(gridCell(32, 120)).toEqual({ x: 0, y: 0 });
    expect(gridCell(831, 599)).toEqual({ x: 9, y: 5 });
    for (const [x, y] of [[31, 120], [832, 120], [32, 600], [32, 119]]) expect(gridCell(x, y)).toBeUndefined();
    for (let y = 0; y < 6; y++) for (let x = 0; x < 10; x++) {
      const center = tileCenter(x, y);
      expect(gridCell(center.x, center.y)).toEqual({ x, y });
    }
  });
});
describe('undo history', () => {
  test('restores budget and heat in order while preserving current preferences', () => {
    const history = new UndoHistory();
    const initial = createState(LEVELS[1]);
    const first = placeTool(initial, 2, 2, 'tree').state;
    history.push(initial);
    history.push(first);
    const second = placeTool(first, 4, 2, 'tree').state;
    const restored = history.pop({ ...second, selectedTool: 'canopy', muted: true });
    expect(restored).toEqual({ ...first, selectedTool: 'canopy', muted: true });
    expect(history.pop(restored)).toEqual({ ...initial, selectedTool: 'canopy', muted: true });
  });
  test('ignores undo outside planning and clears on restart', () => {
    const history = new UndoHistory();
    const initial = createState(LEVELS[1]);
    history.push(initial);
    const simulating = { ...initial, phase: 'simulating' as const };
    expect(history.pop(simulating)).toBe(simulating);
    history.clear();
    expect(history.pop(initial)).toBe(initial);
  });
});
