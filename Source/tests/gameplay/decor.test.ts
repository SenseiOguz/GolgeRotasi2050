import { expect, it } from 'vitest';
import { createState, placeTool } from '../../src/core/rules';
import { LEVELS } from '../../src/core/levels';
import { CITY_RING_GAPS, DECOR_KEYS, decorVisible, planDecor } from '../../src/gameplay/decor';
import { GRID_LAYOUT } from '../../src/ui/layout';

it.each(LEVELS)('places sparse deterministic corner decor away from every road/route in $id', level=>{
  const state=createState(level), before=structuredClone(state);
  const plan=planDecor(state);
  expect(planDecor(structuredClone(state))).toEqual(plan);
  expect(state).toEqual(before);
  expect(plan.length).toBeGreaterThan(0);
  expect(plan.length).toBeLessThanOrEqual(6);
  expect(new Set(plan.map(p=>`${p.x},${p.y}`)).size).toBe(plan.length);
  for(const p of plan) {
    expect(['park','building']).toContain(state.tiles[p.y][p.x].type);
    expect(level.route).not.toContainEqual({x:p.x,y:p.y});
    expect(DECOR_KEYS).toContain(p.key);
    // 24x24 native -> 48x48 screen; include the +6,+4 shadow bounds.
    expect(p.offsetX+24+6).toBeLessThanOrEqual(40);
    expect(p.offsetX-24).toBeGreaterThanOrEqual(-40);
    expect(p.offsetY-48).toBeGreaterThanOrEqual(-40);
    expect(p.offsetY+4).toBeLessThan(40);
  }
});
it('keeps plans stable through placement/undo and hides occupied park decor',()=>{
  const before=createState(LEVELS[1]);
  const p=planDecor(before).find(p=>before.tiles[p.y][p.x].type==='park')!;
  const after=placeTool(before,p.x,p.y,'tree').state;
  expect(planDecor(after)).toEqual(planDecor(before));
  expect(decorVisible(after.tiles[p.y][p.x])).toBe(false);
  expect(decorVisible({...before.tiles[p.y][p.x],placed:'canopy'})).toBe(false);
  expect(decorVisible(before.tiles[p.y][p.x])).toBe(true);
});
it('excludes explicit park/building route cells too',()=>{
  const state=createState(LEVELS[1]);
  state.level.route=state.tiles.flat().filter(t=>t.type==='park'||t.type==='building').map(({x,y})=>({x,y}));
  expect(planDecor(state)).toEqual([]);
});
it('clips the city ring outside the grid and away from HUD and instruction text',()=>{
  for(const gap of CITY_RING_GAPS) {
    const overlapsGrid=gap.x<GRID_LAYOUT.x+GRID_LAYOUT.width && gap.x+gap.width>GRID_LAYOUT.x && gap.y<GRID_LAYOUT.y+GRID_LAYOUT.height && gap.y+gap.height>GRID_LAYOUT.y;
    expect(overlapsGrid).toBe(false);
    expect(gap.y).toBeGreaterThanOrEqual(104);
    expect(gap.y+gap.height).toBeLessThanOrEqual(614);
    expect(gap.x+gap.width).toBeLessThanOrEqual(832);
  }
});
