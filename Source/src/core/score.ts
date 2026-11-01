import type { LevelData, RunResult } from './types';

/** Level-1 exhaustive calibration (18,593,254 unordered legal plans):
 * 8,820 one-star wins; 1,260 two-star wins; 120 three-star wins.
 * Reference 732/740, spent 170: one star. Three-star example: seven canopies
 * at (1,2),(2,2),(3,2),(4,2),(5,2),(5,3),(5,4): 702/740, spent 175.
 * Success always earns one star; every criterion must meet its tier for 2/3.
 * These are educational game targets, not climate/health measurements.
 */
export const STAR_TARGETS = {
  margin: { two: 0.015, three: 0.05 },
  efficiency: { two: 1.6, three: 1.65 },
  budgetSavedFraction: 0.025,
} as const;

export const STAR_CRITERION_TEXT = {
  margin: 'Isı eşiğinin altında pay bırak: 2 yıldız için en az %1,5; 3 için %5.',
  budgetLeft: 'Bütçenin en az %2,5’ini koru; gereken tutar yukarı yuvarlanır.',
  efficiency: 'Harcanan lira başına ısı azaltımı: 2 yıldız için 1,60; 3 için 1,65.',
} as const;

/** Display-only rounding; scoring always uses the original numeric thresholds. */
export function formatStarValue(value: number, kind: 'percentage' | 'efficiency'): string {
  return new Intl.NumberFormat('tr-TR', {
    useGrouping: false,
    maximumFractionDigits: kind === 'percentage' ? 1 : 2,
  }).format(kind === 'percentage' ? value * 100 : value);
}

export interface StarCriterion {
  value: number;
  targets: { two: number; three: number };
  meetsTwo: boolean;
  meetsThree: boolean;
  explanation: string;
}
export interface StarScore {
  stars: 0 | 1 | 2 | 3;
  criteria: { margin: StarCriterion; budgetLeft: StarCriterion; efficiency: StarCriterion };
}

/** Pure: reads only the level, completed run and its unmodified baseline load.
 * margin = (threshold-totalLoad)/threshold. A zero threshold has zero margin.
 * efficiency = (initialLoad-totalLoad)/budgetSpent; zero spend has efficiency 0
 * (never Infinity/free bonus). Savings target is shared by both bonus tiers.
 */
export function computeStars(level: LevelData, result: RunResult, initialLoad: number): StarScore {
  const criterion = (value: number, targets: { two: number; three: number }, explanation: string): StarCriterion => ({
    value, targets: { ...targets }, meetsTwo: value >= targets.two, meetsThree: value >= targets.three, explanation,
  });
  const targets = level.stars;
  const margin = targets ? { two: targets.margin2, three: targets.margin3 } : STAR_TARGETS.margin;
  const efficiency = targets ? { two: targets.eff2, three: targets.eff3 } : STAR_TARGETS.efficiency;
  const savings = targets?.savings ?? STAR_TARGETS.budgetSavedFraction;
  const saved = Math.ceil(level.budget * savings);
  const descriptions = targets ? {
    margin: 'Isı eşiğinin altında pay bırak: 2 yıldız için %' + formatStarValue(margin.two, 'percentage') + '; 3 için %' + formatStarValue(margin.three, 'percentage') + '.',
    budgetLeft: 'Bütçenin en az %' + formatStarValue(savings, 'percentage') + ' kadarını koru; gereken tutar yukarı yuvarlanır.',
    efficiency: 'Harcanan lira başına ısı azaltımı: 2 yıldız için ' + formatStarValue(efficiency.two, 'efficiency') + '; 3 için ' + formatStarValue(efficiency.three, 'efficiency') + '.',
  } : STAR_CRITERION_TEXT;
  const criteria = {
    margin: criterion(level.heatThreshold > 0 ? (level.heatThreshold - result.totalLoad) / level.heatThreshold : 0, margin, descriptions.margin),
    budgetLeft: criterion(result.budgetLeft, { two: saved, three: saved }, descriptions.budgetLeft),
    efficiency: criterion(result.budgetSpent > 0 ? (initialLoad - result.totalLoad) / result.budgetSpent : 0, efficiency, descriptions.efficiency),
  };
  const all = Object.values(criteria);
  const stars = !result.success ? 0 : all.every(c => c.meetsThree) ? 3 : all.every(c => c.meetsTwo) ? 2 : 1;
  return { stars, criteria };
}
