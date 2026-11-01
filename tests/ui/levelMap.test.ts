import { expect, test } from 'vitest';
import { LevelManager } from '../../src/core/levelManager';
import { LEVELS } from '../../src/core/levels';
import { MAP_INFO_RECT, canPlay, consumeUnlock, currentLevel, mapLayout, nodeState, pointOnPath } from '../../src/ui/levelMap';
const levels = Array.from({ length: 4 }, (_, i) => ({ ...LEVELS[0], id: `level-${i}` }));
test('fresh map only permits first node and completed replays stay playable', () => {
  const manager = new LevelManager(levels);
  expect(levels.map(l => nodeState(manager, l.id, currentLevel(manager)))).toEqual(['current', 'locked', 'locked', 'locked']);
  expect(canPlay(manager, levels[1].id)).toBe(false);
  expect(manager.recordResult(levels[1].id, true, 3, 20).newlyUnlocked).toBeNull();
  manager.recordResult(levels[0].id, true, 2, 20);
  expect(nodeState(manager, levels[0].id, levels[1].id)).toBe('done');
  expect(canPlay(manager, levels[0].id)).toBe(true);
  expect(canPlay(manager, levels[1].id)).toBe(true);
  expect(consumeUnlock(manager)).toBe(levels[1].id);
  expect(consumeUnlock(manager)).toBeNull();
  manager.reset(); expect(canPlay(manager, levels[1].id)).toBe(false);
});
test('fallback accepts arbitrary catalogs and paths interpolate by distance', () => {
  const layout = mapLayout(levels);
  expect(layout.nodes.map(n => n.levelId)).toEqual(levels.map(l => l.id));
  expect(layout.paths).toHaveLength(3);
  expect(mapLayout([])).toEqual({ nodes: [], paths: [] });
  expect(pointOnPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 30 }], .5)).toEqual({ x: 10, y: 10 });
  expect(mapLayout(levels, { nodes: [{ levelId: levels[0].id, x: NaN, y: 3 }] }).nodes[0]).toEqual(layout.nodes[0]);
});

test('fixed ART-MAP nodes, labels, courier and road stay clear for every selection at both sizes', () => {
  const nativeNodes = [[112, 242], [380, 278], [500, 275], [560, 124]];
  const nativePaths = [
    [[112,242],[140,262],[170,282],[200,298],[230,310],[270,314],[310,310],[345,295],[380,278]],
    [[380,278],[420,276],[460,275],[500,275]],
    [[500,275],[530,274],[558,268],[560,230],[560,190],[560,150],[560,124]],
  ];
  const intersects = (a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  for (const scale of [1, 1.5]) for (const selected of nativeNodes.keys()) {
    const card = Object.fromEntries(Object.entries(MAP_INFO_RECT).map(([k, v]) => [k, v * scale])) as typeof MAP_INFO_RECT;
    for (const [i, [x, y]] of nativeNodes.entries()) {
      // Include node pop scale, label below the marker, and selected courier above it.
      const bounds = { x: (x * 2 - 70) * scale, y: (y * 2 - (i === selected ? 88 : 40)) * scale, width: 140 * scale, height: (i === selected ? 144 : 96) * scale };
      expect(intersects(card, bounds)).toBe(false);
    }
    for (const path of nativePaths) for (let i = 0; i <= 100; i++) {
      const p = pointOnPath(path.map(([x,y]) => ({ x, y })), i / 100);
      expect(intersects(card, { x: (p.x * 2 - 8) * scale, y: (p.y * 2 - 8) * scale, width: 16 * scale, height: 16 * scale })).toBe(false);
    }
  }
});
