import type { LevelData, RunResult } from '../core/types';
import { computeRun, createState } from '../core/rules';
import { computeStars } from '../core/score';
import type { StarScore } from '../core/score';

type CriterionKey = keyof StarScore['criteria'];
const number = (value: number, digits = 2): string => value.toFixed(digits).replace('.', ',');

/** Presentation only: all awards, targets and explanations come from core/score. */
export function starDisplay(level: LevelData, result: RunResult, initialLoad = computeRun(createState(level)).totalLoad) {
  const score = computeStars(level, result, initialLoad);
  const tier = score.stars < 2 ? 'two' : 'three';
  const keys: CriterionKey[] = ['margin', 'budgetLeft', 'efficiency'];
  const criteria = score.stars === 0 ? [] : keys.map(key => {
    const criterion = score.criteria[key];
    const passed = tier === 'two' ? criterion.meetsTwo : criterion.meetsThree;
    const valueLabel = key === 'margin' ? '%' + number(criterion.value * 100) : key === 'budgetLeft' ? criterion.value + ' kaldı' : number(criterion.value);
    return { key, passed, explanation: criterion.explanation, valueLabel, target: criterion.targets[tier] };
  });
  const next = criteria.filter(criterion => !criterion.passed).map(criterion => criterion.key === 'margin' ? `pay en az %${number(criterion.target * 100, 1)}` : criterion.key === 'budgetLeft' ? `bütçe en az ${criterion.target}` : `verim en az ${number(criterion.target)}`).join(' · ');
  return {
    stars: score.stars,
    slots: score.stars === 0 ? [] : [0, 1, 2].map(index => index < score.stars),
    criteria,
    motivation: score.stars === 0 ? '' : score.stars === 3 ? 'Üç yıldız tamam! Farklı müdahale kombinasyonlarıyla da dene.' : 'Bir yıldız daha için: ' + next + '.',
  };
}
export type StarDisplay = ReturnType<typeof starDisplay>;
