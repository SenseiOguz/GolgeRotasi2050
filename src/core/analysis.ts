import { canPlace, computeRun, createState } from './rules';
import { computeStars } from './score';
import { TOOLS } from './tools';
import type { LevelData, ToolId } from './types';

export interface PlanPlacement { x: number; y: number; tool: ToolId }
export interface PlanAnalysis {
  total: number;
  simulated: number;
  counts: [number, number, number, number];
  winning: number;
  threeStar: number;
  bestLoad: number;
  bestPlan: PlanPlacement[];
  winningPlan: PlanPlacement[] | null;
  threeStarPlan: PlanPlacement[] | null;
}

/** Offline calibration only; no game runtime imports this module.
 * Enumerates each unordered legal plan once (including empty), respecting budget,
 * blocked cells and per-tool limits. maxPlacements optionally bounds search size;
 * omit it for exhaustive calibration. Losing plans proven by an upper bound on
 * cooling skip simulation; every possible winner uses the real rules and score.
 */
export function enumeratePlans(level: LevelData, opts: { maxPlacements?: number } = {}): PlanAnalysis {
  const base = createState(level);
  const baseline = computeRun(base).totalLoad;
  const cells = base.tiles.flat().map(tile => level.tools
    .filter((tool, index, tools) => tools.indexOf(tool) === index && canPlace(base, tile.x, tile.y, tool).ok)
    .map(tool => ({ x: tile.x, y: tile.y, tool, cost: TOOLS[tool].cost,
      reduction: level.route.reduce((sum, point) => {
        const distance = Math.abs(point.x - tile.x) + Math.abs(point.y - tile.y);
        return sum + (distance === 0 ? TOOLS[tool].coolingCenter : distance === 1 ? TOOLS[tool].coolingNeighbor : 0);
      }, 0),
    }))).filter(options => options.length > 0);
  const analysis: PlanAnalysis = { total: 0, simulated: 0, counts: [0, 0, 0, 0], winning: 0,
    threeStar: 0, bestLoad: baseline, bestPlan: [], winningPlan: null, threeStarPlan: null };
  const plan: PlanPlacement[] = [];
  const used: Record<ToolId, number> = { tree: 0, canopy: 0, coolRoof: 0 };
  const copyPlan = (): PlanPlacement[] => plan.map(({ x, y, tool }) => ({ x, y, tool }));
  function visit(start: number, spent: number, reduction: number): void {
    analysis.total++;
    // Simulate when a plan may win OR improve the best load, preserving exact minima.
    if (baseline - reduction > level.heatThreshold && baseline - reduction >= analysis.bestLoad) {
      analysis.counts[0]++;
    } else {
      const selected = new Map(plan.map(p => [`${p.x},${p.y}`, p.tool]));
      const result = computeRun({ ...base, budgetLeft: level.budget - spent,
        tiles: base.tiles.map(row => row.map(tile => {
          const tool = selected.get(`${tile.x},${tile.y}`);
          return tool ? { ...tile, placed: tool } : tile;
        })) });
      analysis.simulated++;
      const stars = computeStars(level, result, baseline).stars;
      analysis.counts[stars]++;
      if (result.totalLoad < analysis.bestLoad) { analysis.bestLoad = result.totalLoad; analysis.bestPlan = copyPlan(); }
      if (result.success) {
        analysis.winning++;
        analysis.winningPlan ??= copyPlan();
      }
      if (stars === 3) { analysis.threeStar++; analysis.threeStarPlan ??= copyPlan(); }
    }
    if (plan.length >= (opts.maxPlacements ?? Infinity)) return;
    for (let i = start; i < cells.length; i++) for (const option of cells[i]) {
      if (spent + option.cost > level.budget || used[option.tool] >= (level.toolLimits?.[option.tool] ?? Infinity)) continue;
      used[option.tool]++;
      plan.push(option);
      visit(i + 1, spent + option.cost, reduction + option.reduction);
      plan.pop();
      used[option.tool]--;
    }
  }
  visit(0, 0, 0);
  return analysis;
}
