import type { GameState, LevelData, RunResult, Tile, Tool, ToolId } from './types';
import { TOOLS } from './tools';

export type PlacementResult = { ok: true } | {
  ok: false; reason: 'invalid_tile' | 'no_budget' | 'occupied' | 'no_tool' | 'blocked' | 'limit';
};

const clamp = (heat: number): number => Math.max(0, Math.min(100, heat));

/** Fresh matrix; additive center + orthogonal neighbor cooling, never cumulative across calls. */
export function computeHeat(tiles: Tile[][], tools: Record<ToolId, Tool> = TOOLS): Tile[][] {
  const sources = tiles.flat().filter(tile => tile.placed !== undefined);
  return tiles.map(row => row.map(tile => {
    let cooling = 0;
    for (const source of sources) {
      const tool = tools[source.placed!];
      const distance = Math.abs(source.x - tile.x) + Math.abs(source.y - tile.y);
      if (distance === 0) cooling += tool.coolingCenter;
      else if (distance === 1) cooling += tool.coolingNeighbor;
    }
    return { ...tile, heat: clamp(tile.baseHeat - cooling) };
  }));
}

export function createState(level: LevelData): GameState {
  // Copy level data as well so editing a returned state cannot alter the catalog.
  const snapshot = structuredClone(level);
  const tiles = snapshot.tiles.map((row, y) => row.map((type, x) => ({
    x, y, type, baseHeat: snapshot.baseHeat[y][x], heat: snapshot.baseHeat[y][x],
  })));
  return { level: snapshot, tiles: computeHeat(tiles), budgetLeft: level.budget,
    phase: 'planning', selectedTool: null, muted: false };
}

/** Precedence: unavailable tool, invalid tile/phase, blocked, occupied, limit, budget. */
export function canPlace(state: GameState, x: number, y: number, toolId: ToolId | null): PlacementResult {
  if (!toolId || !Object.hasOwn(TOOLS, toolId) || !state.level.tools.includes(toolId)) {
    return { ok: false, reason: 'no_tool' };
  }
  const tile = Number.isInteger(x) && Number.isInteger(y) ? state.tiles[y]?.[x] : undefined;
  if (state.phase !== 'planning' || !tile || !TOOLS[toolId].allowedOn.includes(tile.type)) {
    return { ok: false, reason: 'invalid_tile' };
  }
  if (state.level.blockedCells?.some(cell => cell.x === x && cell.y === y)) return { ok: false, reason: 'blocked' };
  if (tile.placed) return { ok: false, reason: 'occupied' };
  const limit = state.level.toolLimits?.[toolId];
  if (limit !== undefined && state.tiles.flat().filter(cell => cell.placed === toolId).length >= limit) {
    return { ok: false, reason: 'limit' };
  }
  if (state.budgetLeft < TOOLS[toolId].cost) return { ok: false, reason: 'no_budget' };
  return { ok: true };
}

export function placeTool(state: GameState, x: number, y: number, toolId: ToolId | null): { state: GameState; result: PlacementResult } {
  const result = canPlace(state, x, y, toolId);
  if (!result.ok || !toolId) return { state, result };
  const tiles = state.tiles.map(row => row.map(tile => tile.x === x && tile.y === y
    ? { ...tile, placed: toolId } : tile));
  return { state: { ...state, tiles: computeHeat(tiles), budgetLeft: state.budgetLeft - TOOLS[toolId].cost }, result };
}

/** Remove any intervention with a full refund; empty/invalid cells are a no-op.
 * For chronological undo, callers may simply retain the prior immutable GameState.
 */
export function removeTool(state: GameState, x: number, y: number): GameState {
  const tile = Number.isInteger(x) && Number.isInteger(y) ? state.tiles[y]?.[x] : undefined;
  if (state.phase !== 'planning' || !tile?.placed) return state;
  const refund = TOOLS[tile.placed].cost;
  const tiles = state.tiles.map(row => row.map(cell => {
    if (cell.x !== x || cell.y !== y) return cell;
    const copy = { ...cell };
    delete copy.placed;
    return copy;
  }));
  return { ...state, tiles: computeHeat(tiles), budgetLeft: state.budgetLeft + refund };
}

/** Unitless educational load = sum of all route samples, including start and goal.
 * Recompute heat so a stale render cache cannot change the simulation outcome.
 */
export function computeRun(state: GameState): RunResult {
  const tiles = computeHeat(state.tiles);
  let totalLoad = 0;
  let peakHeat = 0;
  const steps = state.level.route.map(({ x, y }, index) => {
    const wave = state.level.heatWave;
    const bonus = wave && index >= wave.fromStep && index <= wave.toStep ? wave.bonus : 0;
    const heat = clamp(tiles[y][x].heat + bonus);
    totalLoad += heat;
    peakHeat = Math.max(peakHeat, heat);
    return { index, x, y, heat, cumulativeLoad: totalLoad };
  });
  return { success: totalLoad <= state.level.heatThreshold, totalLoad, peakHeat,
    threshold: state.level.heatThreshold, steps,
    budgetSpent: state.level.budget - state.budgetLeft, budgetLeft: state.budgetLeft };
}

/** Piecewise RGB interpolation: 0 COOL, 50 WARN, 100 HOT. */
export function heatToColor(heat: number): number {
  const value = clamp(heat);
  const [from, to, t] = value <= 50
    ? [0x43c6a5, 0xf0c35c, value / 50] : [0xf0c35c, 0xf87852, (value - 50) / 50];
  const channel = (shift: number) => Math.round(((from >> shift) & 255) * (1 - t) + ((to >> shift) & 255) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
