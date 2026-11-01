import { expect, it } from 'vitest';
import { groundKey, heatBand, heatGround, heatLevel, heatStyle, nextHeatmapVisibility } from '../../src/gameplay/visuals';
import { computeHeat, createState, placeTool } from '../../src/core/rules';
import { LEVELS } from '../../src/core/levels';
it('uses explicit real-heat bands and excludes buildings/water from heat', () => {
  expect([0,49,50,79,80,100].map(heatBand)).toEqual(['cool','cool','normal','normal','hot','hot']);
  expect([0,25,50,75,100].map(heatLevel)).toEqual([0,1,2,2,3]);
  const tiles = createState(LEVELS[1]).tiles.flat();
  for (const tile of tiles) expect(heatGround(tile)).toBe(!['building','water'].includes(tile.type));
});
it('selects variants from computeHeat after placement and undo snapshot', () => {
  const before = createState(LEVELS[1]);
  const after = placeTool(before,2,2,'tree').state;
  expect(after.tiles).toEqual(computeHeat(after.tiles));
  expect(groundKey(before.tiles[2][2])).toBe('tile-road-hot');
  expect(groundKey(after.tiles[2][2])).toBe('tile-road');
  expect(groundKey(before.tiles[2][2])).toBe('tile-road-hot');
});
import { roadShape } from '../../src/gameplay/visuals';
it('connects level one corners and vertical road to route neighbours', () => {
  const state = createState(LEVELS[1]);
  expect(roadShape(state,5,2)).toBe('-corner-ws');
  expect(roadShape(state,5,3)).toBe('-v');
  expect(roadShape(state,5,4)).toBe('-corner-en');
  expect(roadShape(state,3,2)).toBe('');
});
it.each([['-corner-es',[[1,0],[0,1]]],['-corner-en',[[1,0],[0,-1]]],['-corner-ws',[[-1,0],[0,1]]],['-corner-wn',[[-1,0],[0,-1]]]] as const)('selects %s from orthogonal connectivity', (expected, neighbours) => {
  const state = createState(LEVELS[1]);
  state.level.route = [];
  state.tiles.forEach(row=>row.forEach(t=>t.type='building'));
  neighbours.forEach(([dx,dy])=>state.tiles[2+dy][2+dx].type='road');
  expect(roadShape(state,2,2)).toBe(expected);
});

it('maps real heat into two cool levels, yellow medium and orange hot',()=>{
  expect(heatStyle(24).color).toBe(0x43c6a5);
  expect(heatStyle(49).color).toBe(0x7fe0b8);
  expect(heatStyle(50).color).toBe(0xf0c35c);
  expect(heatStyle(79).color).toBe(0xf0c35c);
  expect(heatStyle(80)).toEqual({color:0xf87852,alpha:.5,density:12});
  expect(heatStyle(100)).toEqual(heatStyle(80));
});
it('applies UI heat toggles without generating follow-up transitions on repeated events',()=>{
  const initial = {visible:true};
  expect(nextHeatmapVisibility(initial,true)).toBe(initial);
  const off = nextHeatmapVisibility(initial,false);
  expect(off.visible).toBe(false);
  expect(nextHeatmapVisibility(off,false)).toBe(off);
  const on = nextHeatmapVisibility(off,true);
  expect(on.visible).toBe(true);
  expect(nextHeatmapVisibility(on,true)).toBe(on);
});
