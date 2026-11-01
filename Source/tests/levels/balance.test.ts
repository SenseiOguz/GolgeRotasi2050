import { expect, it } from 'vitest';
import { LEVELS } from '../../src/core/levels';
import { enumeratePlans, type PlanPlacement } from '../../src/core/analysis';
import { computeRun, createState, placeTool } from '../../src/core/rules';
import { computeStars } from '../../src/core/score';

const tree = (x: number,y: number): PlanPlacement => ({x,y,tool:'tree'});
const canopy = (x: number,y: number): PlanPlacement => ({x,y,tool:'canopy'});
const roof = (x: number,y: number): PlanPlacement => ({x,y,tool:'coolRoof'});
export const PROVEN_PLANS = [
  {win:[roof(2,1),tree(3,1),tree(4,1),tree(2,2)], three:[tree(2,2),tree(3,2),tree(4,2)]},
  {win:[tree(2,2),tree(4,2),tree(5,4),canopy(5,3),canopy(7,4)], three:[1,2,3,4,5].map(x=>canopy(x,2)).concat([canopy(5,3),canopy(5,4)])},
  {win:[tree(1,2),...[2,3,4,5,6].map(x=>canopy(x,2))], three:[1,2,3,4,5,6].map(x=>canopy(x,2)).concat([canopy(6,3)])},
  {win:[roof(0,1),tree(1,2),...[2,3,4,5].map(x=>canopy(x,2))], three:[tree(1,2),tree(2,2),...[3,4,5].map(x=>canopy(x,2))]},
];
// Exact exhaustive table: total, losing/one/two/three-star counts, best load.
const BALANCE = [
  {total:1329,counts:[642,602,81,4],best:204},
  {total:18593254,counts:[18583054,8820,1260,120],best:702},
  {total:28137677,counts:[28136297,1260,0,120],best:714},
  {total:1393461,counts:[1368261,22680,0,2520],best:726},
];

it('keeps routes contiguous, deliveries on route and construction on usable cells',()=>{
  expect(LEVELS.map(l=>l.id)).toEqual(['yesil-baslangic','yogun-mahalle','sanayi-krizi','kritik-esik']);
  for(const level of LEVELS) {
    expect(level.tiles).toHaveLength(6);
    expect(level.baseHeat).toHaveLength(6);
    for(const row of [...level.tiles,...level.baseHeat]) expect(row).toHaveLength(10);
    level.route.forEach((p,i)=>{
      expect(['start','road','goal']).toContain(level.tiles[p.y][p.x]);
      if(i) expect(Math.abs(p.x-level.route[i-1].x)+Math.abs(p.y-level.route[i-1].y)).toBe(1);
    });
    for(const p of level.deliveries ?? []) expect(level.route).toContainEqual(p);
    for(const p of level.blockedCells ?? []) expect(['building','road','park']).toContain(level.tiles[p.y][p.x]);
  }
});

it('exhaustively balances all four levels and proves increasing difficulty by best margin',()=>{
  let previousMargin=Infinity;
  const table=LEVELS.map((level,index)=>{
    const baseline=computeRun(createState(level));
    expect(baseline.success).toBe(false);
    const analysis=enumeratePlans(level);
    expect(analysis.total).toBe(BALANCE[index].total);
    expect(analysis.counts).toEqual(BALANCE[index].counts);
    expect(analysis.bestLoad).toBe(BALANCE[index].best);
    expect(analysis.winning).toBeGreaterThan(0);
    expect(analysis.threeStar).toBeGreaterThan(0);
    const margin=(level.heatThreshold-analysis.bestLoad)/level.heatThreshold;
    expect(margin).toBeLessThan(previousMargin);
    previousMargin=margin;
    for(const [kind,plan] of Object.entries(PROVEN_PLANS[index])) {
      let state=createState(level);
      for(const p of plan) {
        const placed=placeTool(state,p.x,p.y,p.tool);
        expect(placed.result.ok).toBe(true);
        state=placed.state;
      }
      const result=computeRun(state);
      expect(result.success).toBe(true);
      if(kind==='three') expect(computeStars(level,result,baseline.totalLoad).stars).toBe(3);
      if(index===1 && kind==='win') expect(result.totalLoad).toBe(732);
    }
    return {level:level.id,total:analysis.total,winning:analysis.winning,one:analysis.counts[1],two:analysis.counts[2],three:analysis.threeStar,best:analysis.bestLoad,baseline:baseline.totalLoad,margin};
  });
  expect(table[1].baseline).toBe(996);
  console.table(table);
},60_000);
