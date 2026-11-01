import type { GameState, ToolId } from '../core/types';
import { TOOLS } from '../core/tools';
import { canPlace, computeRun, placeTool } from '../core/rules';

export function affectedArea(state: GameState, x: number, y: number, tool: ToolId): { x: number; y: number }[] {
  const offsets = TOOLS[tool].coolingNeighbor ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0]];
  return offsets.map(([dx, dy]) => ({ x: x + dx, y: y + dy })).filter(p => Boolean(state.tiles[p.y]?.[p.x]));
}
export function projectedReduction(state: GameState, x: number, y: number, tool: ToolId): number | undefined {
  if (!canPlace(state, x, y, tool).ok) return undefined;
  return computeRun(state).totalLoad - computeRun(placeTool(state, x, y, tool).state).totalLoad;
}
export function heatAlpha(heat: number): number { return 0.08 + Math.max(0, Math.min(100, heat)) / 100 * 0.34; }
