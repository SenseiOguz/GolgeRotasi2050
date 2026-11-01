import { computeHeat, computeRun, createState } from '../core/rules';
import type { LevelData, RunResult, Tile, ToolId } from '../core/types';
import { TOOLS } from '../core/tools';

/** UI-owned snapshots; incoming state is never edited, including after undo/retry. */
export class ResultTracker {
  private level?: LevelData;
  private tiles: Tile[][] = [];
  reset(level: LevelData): void { this.level = structuredClone(level); this.tiles = createState(level).tiles; }
  placed(x: number, y: number, toolId: ToolId): void {
    this.tiles = computeHeat(this.tiles.map(row => row.map(tile => tile.x === x && tile.y === y ? { ...tile, placed: toolId } : { ...tile })));
  }
  heatUpdated(tiles: Tile[][]): void { this.tiles = computeHeat(tiles); }
  summary(result: RunResult) {
    if (!this.level) return undefined;
    const initial = createState(this.level);
    const finalTiles = computeHeat(this.tiles);
    const counts: Record<ToolId, number> = { tree: 0, canopy: 0, coolRoof: 0 };
    for (const row of finalTiles) for (const tile of row) if (tile.placed) counts[tile.placed]++;
    return {
      initialLoad: computeRun(initial).totalLoad, initialTiles: computeHeat(initial.tiles), finalTiles, counts,
      finalLoad: result.totalLoad, budgetLeft: result.budgetLeft, budgetSpent: result.budgetSpent,
      hottest: [...result.steps].sort((a, b) => b.heat - a.heat || a.index - b.index).slice(0, 3),
    };
  }
}
export type ResultSummary = NonNullable<ReturnType<ResultTracker['summary']>>;

export function failureHint(level: LevelData, summary: ResultSummary): string {
  const target = summary.hottest.find(step => level.tiles[step.y]?.[step.x] === 'road') ?? summary.hottest[0];
  if (!target) return 'İpucu: Rotanın en sıcak yol hücrelerini gölgele.';
  const position = `(${target.x + 1}, ${target.y + 1})`;
  // Only recommend undoing an intervention that actually contributes no route cooling.
  const distant = summary.budgetSpent > 0 && summary.finalTiles.flat().some(tile => {
    if (!tile.placed) return false;
    const tool = TOOLS[tile.placed];
    return level.route.every(step => {
      const distance = Math.abs(tile.x - step.x) + Math.abs(tile.y - step.y);
      return distance !== 0 && (distance !== 1 || tool.coolingNeighbor === 0);
    });
  });
  return distant ? `İpucu: Uzak müdahaleyi geri al; ${position} çevresine gölge ekle.` : `İpucu: ${position} çevresine ağaç veya gölgelik yerleştir.`;
}
