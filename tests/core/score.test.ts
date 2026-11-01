import { describe, expect, it } from 'vitest';
import { LEVELS, getLevel } from '../../src/core/levels';
import { enumeratePlans } from '../../src/core/analysis';
import { TOOLS } from '../../src/core/tools';
import { canPlace, computeRun, createState, placeTool } from '../../src/core/rules';
import { computeStars, formatStarValue, STAR_CRITERION_TEXT } from '../../src/core/score';
import type { ToolId } from '../../src/core/types';

const level = getLevel('yogun-mahalle') ?? LEVELS[0];
const baseline = computeRun(createState(level)).totalLoad;
type Placement = { x: number; y: number; tool: ToolId };
function run(plan: Placement[]) {
  let state = createState(level);
  for (const { x, y, tool } of plan) {
    const placed = placeTool(state, x, y, tool);
    expect(placed.result.ok).toBe(true);
    state = placed.state;
  }
  return computeRun(state);
}
const canopy = (x: number, y: number): Placement => ({ x, y, tool: 'canopy' });
const tree = (x: number, y: number): Placement => ({ x, y, tool: 'tree' });
const reference = [tree(2,2),tree(4,2),tree(5,4),canopy(5,3),canopy(7,4)];
const threeStar = [canopy(1,2),canopy(2,2),canopy(3,2),canopy(4,2),canopy(5,2),canopy(5,3),canopy(5,4)];

it.each([
  [.018, 'percentage', '1,8'], [.03, 'percentage', '3'],
  [.025, 'percentage', '2,5'], [.05, 'percentage', '5'],
  [1.6, 'efficiency', '1,6'], [1.65, 'efficiency', '1,65'],
  [.01849, 'percentage', '1,8'], [1.658, 'efficiency', '1,66'],
] as const)('formats %s as Turkish %s text %s', (value, kind, expected) => {
  expect(formatStarValue(value, kind)).toBe(expected);
});

// Thresholds read from feat/four-levels without depending on its catalog order.
it.each([
  { stars: { margin2: .10, margin3: .20, savings: .10, eff2: 1, eff3: 1.4 }, expected: ['10', '20', '10', '1', '1,4'] },
  { stars: { margin2: .015, margin3: .05, savings: .025, eff2: 1.6, eff3: 1.65 }, expected: ['1,5', '5', '2,5', '1,6', '1,65'] },
  { stars: { margin2: .01, margin3: .03, savings: 0, eff2: 1.5, eff3: 1.65 }, expected: ['1', '3', '0', '1,5', '1,65'] },
  { stars: { margin2: .005, margin3: .018, savings: .05, eff2: 1.5, eff3: 1.58 }, expected: ['0,5', '1,8', '5', '1,5', '1,58'] },
])('keeps integrated level thresholds readable: $expected', ({ stars, expected }) => {
  const score = computeStars({ ...level, stars }, run([]), baseline);
  const { margin, budgetLeft, efficiency } = score.criteria;
  expect(margin.explanation).toContain('%' + expected[0] + ';');
  expect(margin.explanation).toContain('%' + expected[1] + '.');
  expect(budgetLeft.explanation).toContain('%' + expected[2] + ' ');
  expect(efficiency.explanation).toContain('için ' + expected[3] + ';');
  expect(efficiency.explanation).toContain('için ' + expected[4] + '.');
  for (const { explanation } of Object.values(score.criteria)) {
    expect(explanation).not.toMatch(/\d+[.,]\d{3,}/u);
    expect(explanation).not.toMatch(/\d+\.\d/u);
  }
  expect(margin.targets).toEqual({ two: stars.margin2, three: stars.margin3 });
  expect(efficiency.targets).toEqual({ two: stars.eff2, three: stars.eff3 });
});

describe('pure three-star scoring', () => {
  it('awards zero to the unmodified 996/740 loss', () => {
    expect(baseline).toBe(996);
    expect(computeStars(level, run([]), baseline).stars).toBe(0);
  });
  it('gives the exact reference 732/740, spent170 one star', () => {
    const result = run(reference);
    expect([result.totalLoad,result.budgetSpent]).toEqual([732,170]);
    const score = computeStars(level,result,baseline);
    expect(score.stars).toBe(1);
    expect(score.criteria.margin.meetsTwo).toBe(false);
    expect(score.criteria.budgetLeft.value).toBe(10);
  });
  it('awards two stars to a legal efficient plan with enough savings and margin', () => {
    const result = run([tree(5,2),canopy(1,2),canopy(2,2),canopy(3,2),canopy(4,2),canopy(5,3)]);
    expect([result.totalLoad,result.budgetSpent,result.budgetLeft]).toEqual([726,165,15]);
    expect(computeStars(level,result,baseline).stars).toBe(2);
  });
  it('awards three stars to an achievable seven-canopy plan', () => {
    const result = run(threeStar);
    expect([result.totalLoad,result.budgetSpent,result.budgetLeft]).toEqual([702,175,5]);
    const score = computeStars(level,result,baseline);
    expect(score.stars).toBe(3);
    expect(score.criteria.efficiency.value).toBe(1.68);
    expect(Object.values(score.criteria).every(c=>c.meetsThree)).toBe(true);
  });
  it('does not mutate inputs or share mutable target objects across calls', () => {
    const result = run(reference), snapshot = structuredClone({level,result});
    const score = computeStars(level,result,baseline);
    score.criteria.margin.targets.two = 99;
    expect({level,result}).toEqual(snapshot);
    expect(computeStars(level,result,baseline).criteria.margin.targets.two).toBe(.015);
    expect(Object.values(STAR_CRITERION_TEXT).every(text=>text.length>0)).toBe(true);
  });
  it('keeps zero-spend and zero-threshold arithmetic finite without a free bonus', () => {
    const freeLevel = { ...level, heatThreshold: 0 };
    const result = { ...run([]),success:true,totalLoad:0,threshold:0,budgetSpent:0 };
    const score = computeStars(freeLevel,result,0);
    expect(score.stars).toBe(1);
    expect(score.criteria.efficiency.value).toBe(0);
    expect(score.criteria.margin.value).toBe(0);
  });
});

it('exhaustively calibrates every unordered legal legacy-map plan within budget', () => {
  const base = createState(level);
  const cells = base.tiles.flat().map(tile => level.tools.filter(tool=>canPlace(base,tile.x,tile.y,tool).ok).map(tool=>({
    x:tile.x,y:tile.y,tool,cost:TOOLS[tool].cost,
    // Upper bound only: ignoring clamping can overestimate cooling, never miss a win.
    reduction:level.route.reduce((sum,p)=>{
      const d=Math.abs(p.x-tile.x)+Math.abs(p.y-tile.y);
      return sum+(d===0?TOOLS[tool].coolingCenter:d===1?TOOLS[tool].coolingNeighbor:0);
    },0),
  }))).filter(options=>options.length>0);
  const { total, counts, winning, threeStar: threeStarCount, bestLoad, bestPlan } = enumeratePlans(level);
  expect(winning).toBe(10_200);
  expect(threeStarCount).toBe(120);
  expect(run(bestPlan).totalLoad).toBe(bestLoad);
  // Independently count all legal plans with a cost-only generating polynomial.
  let dp = Array<number>(level.budget+1).fill(0); dp[0]=1;
  for (const options of cells) {
    const next=dp.slice();
    for (const option of options) for (let cost=0;cost+option.cost<=level.budget;cost++) next[cost+option.cost]+=dp[cost];
    dp=next;
  }
  expect(total).toBe(dp.reduce((a,b)=>a+b,0));
  expect(total).toBe(18_593_254);
  expect(counts).toEqual([18_583_054,8_820,1_260,120]);
  expect(counts[3]/(counts[1]+counts[2]+counts[3])).toBeLessThan(.02);
  console.table(counts.map((plans,stars)=>({stars,plans})));
}, 15_000);
