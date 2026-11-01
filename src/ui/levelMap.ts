import { PROGRESS_KEY, type LevelManager } from '../core/levelManager';
import type { LevelData } from '../core/types';

export type Point = { x: number; y: number };
export type MapNode = Point & { levelId: string };
export type NodeState = 'locked' | 'open' | 'current' | 'done';
/** Painted ART-MAP roads reach y=628 (including dots: 636). */
export const MAP_INFO_RECT = { x: 24, y: 640, width: 1232, height: 80 } as const;
export function nodeState(manager: LevelManager, id: string, current: string): NodeState {
  return !manager.isUnlocked(id) ? 'locked' : manager.isCompleted(id) ? 'done' : id === current ? 'current' : 'open';
}
export function currentLevel(manager: LevelManager): string {
  const levels = manager.levels();
  // The public manager deliberately exposes no mutable progress object.
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(PROGRESS_KEY) ?? 'null');
    if (typeof saved?.lastPlayed === 'string' && manager.isUnlocked(saved.lastPlayed)) return saved.lastPlayed;
  } catch { /* Highest unlocked is also the storage-free fallback. */ }
  return levels.filter(level => manager.isUnlocked(level.id)).at(-1)?.id ?? '';
}
export function consumeUnlock(manager: LevelManager): string | null {
  const id = manager.consumePendingUnlock();
  return id && manager.isUnlocked(id) && manager.index(id) > 0 ? id : null;
}
export function canPlay(manager: LevelManager, id: string): boolean { return manager.isUnlocked(id); }
export function mapLayout(levels: LevelData[], raw?: unknown): { nodes: MapNode[]; paths: Point[][] } {
  const source = raw as { nodes?: MapNode[]; paths?: number[][][] } | undefined;
  const valid = (p: Point): boolean => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 640 && p.y >= 0 && p.y <= 360;
  const nodes = levels.map((level, i) => {
    const supplied = Array.isArray(source?.nodes) ? source.nodes.find(node => node?.levelId === level.id) : undefined;
    return supplied && valid(supplied) ? { ...supplied } : { levelId: level.id, x: levels.length === 1 ? 320 : 90 + i * 460 / Math.max(1, levels.length - 1), y: i % 2 ? 118 : 208 };
  });
  const paths = nodes.slice(1).map((node, i) => {
    const path = source?.paths?.[i];
    const points = Array.isArray(path) ? path.map(p => ({ x: p?.[0], y: p?.[1] })) : [];
    return points.length >= 2 && points.every(valid) ? [nodes[i], ...points, node] : [nodes[i], { x: (nodes[i].x + node.x) / 2, y: nodes[i].y }, { x: (nodes[i].x + node.x) / 2, y: node.y }, node];
  });
  return { nodes, paths };
}
/** Arc-length sampling keeps the courier and progressive road in sync. */
export function pointOnPath(path: Point[], progress: number): Point {
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
  let distance = lengths.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, progress));
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] && lengths[i] > 0) {
      const ratio = distance / lengths[i];
      return { x: path[i].x + (path[i + 1].x - path[i].x) * ratio, y: path[i].y + (path[i + 1].y - path[i].y) * ratio };
    }
    distance -= lengths[i];
  }
  return path.at(-1) ?? { x: 0, y: 0 };
}
