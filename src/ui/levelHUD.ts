import type { LevelData, RunStep, Tile, ToolId } from '../core/types';
import type { LevelManager } from '../core/levelManager';
import { computeRun, createState } from '../core/rules';
export function planningLoad(level: LevelData, tiles: Tile[][] = createState(level).tiles): number {
  return computeRun({ ...createState(level), tiles }).totalLoad;
}
export function nextPlayable(manager: LevelManager, id: string, success: boolean): string | null {
  const next = manager.nextId(id);
  return success && next && manager.isUnlocked(next) ? next : null;
}
export function toolCounts(tiles: Tile[][]): Record<ToolId, number> {
  const counts = { tree: 0, canopy: 0, coolRoof: 0 };
  for (const tile of tiles.flat()) if (tile.placed) counts[tile.placed]++;
  return counts;
}
export function mechanicStatus(level: LevelData, step?: RunStep): string {
  const parts: string[] = [];
  if (level.deliveries?.length) {
    const reached = level.deliveries.filter(p => { const index = level.route.findIndex(q => p.x === q.x && p.y === q.y); return index >= 0 && index <= (step?.index ?? -1); }).length;
    parts.push(`Teslimatlar ${reached}/${level.deliveries.length}`);
  }
  if (level.heatWave) {
    const wave = level.heatWave;
    const active = !!step && step.index >= wave.fromStep && step.index <= wave.toStep;
    parts.push(active ? `ISI DALGASI · +${wave.bonus} ısı` : `Isı dalgası: ${wave.fromStep + 1}–${wave.toStep + 1}. adım`);
  }
  return parts.join('   ·   ');
}
