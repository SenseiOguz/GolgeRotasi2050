import { describe, it, expect } from 'vitest';
import { createPixelRegistry, isClassicMode, PIXEL_ASSETS, normalizePixelPath, PIXEL_AREAS, resolveMapLayout, MAP_LAYOUT } from '../../src/assets/pixelManifest';
import { MASTER_PALETTE, isPaletteColor } from '../../src/assets/pixel/palette';
describe('pixel registry', () => {
 it('supports zero assets', () => { expect(createPixelRegistry({})).toEqual([]); expect(Array.isArray(PIXEL_ASSETS)).toBe(true); });
 it('maps existing texture keys and reserved names', () => {
  expect(createPixelRegistry({'./pixel/world/tiles/tile_road.png':'data:road','./pixel/ui/menu/menu-skyline.png':'data:sky','./pixel/world/unknown.png':'?'}).map(a=>a.key)).toEqual(['menu-skyline','tile-road']);
 });
 it('retains explicit override, native size, anchor and sheet metadata', () => {
  const record = { key:'courier',file:'src/assets/pixel/world/characters/hero.png',nativeSize:{width:48,height:48},frames:6,frameWidth:48,frameHeight:48,anchor:{x:.5,y:1} };
  expect(createPixelRegistry({'./pixel/world/characters/hero.png':'data:hero'},[{assets:[record]}])[0]).toEqual({...record,file:'./pixel/world/characters/hero.png',url:'data:hero'});
 });
 it('ignores absent files and unknown keys; deduplicates keys', () => {
  expect(createPixelRegistry({'./pixel/a/courier.png':'a','./pixel/b/courier.png':'b'})).toHaveLength(1);
  expect(createPixelRegistry({},[{assets:[]}])).toEqual([]);
 });
 it('skips manifest records whose PNG was not imported', () => {
  const missing = { key:'courier', file:'src/assets/pixel/world/characters/missing.png', nativeSize:{width:48,height:48}, frames:1, anchor:{x:.5,y:1} };
  expect(createPixelRegistry({}, [{assets:[missing]}])).toEqual([]);
  expect(createPixelRegistry({'./pixel/world/tiles/tile-road.png':'data:road'}, [{assets:[missing]}]).map(asset => asset.key)).toEqual(['tile-road']);
 });
 it('maps every promoted staged road filename and courier direction', () => {
  const urls: Record<string, string> = {};
  const expected: string[] = [];
  for (const direction of ['v', 'corner_es', 'corner_en', 'corner_ws', 'corner_wn']) for (const state of ['', '_hot', '_cool']) {
   urls['./pixel/world/tiles/road_' + direction + state + '.png'] = 'data:road';
   expected.push('tile-road-' + (direction + state).replaceAll('_', '-'));
  }
  for (const direction of ['e', 'n', 'w']) {
   urls['./pixel/world/characters/courier_' + direction + '.png'] = 'data:courier';
   expected.push('courier-' + direction);
  }
  expect(createPixelRegistry(urls).map(asset => asset.key).sort()).toEqual(expected.sort());
 });
 it('registers every F2 result and settings piece', () => {
  const keys = ["icon-result-success","icon-result-fail","ui-toggle-on","ui-toggle-off","ui-slider-track","ui-slider-fill","ui-slider-knob","icon-close","ui-toast-9","ui-toast-warn-9","ui-toast-error-9"];
  const urls = Object.fromEntries(keys.map(key => ['./pixel/ui/' + (key.startsWith('icon-') ? 'icons/' : 'frames/') + key + '.png', 'data:piece']));
  expect(createPixelRegistry(urls).map(asset => asset.key).sort()).toEqual(keys.sort());
 });
 it('registers all five decor keys for object loading', () => {
  const keys = ["decor-bench","decor-lamp","decor-bush","decor-planter","decor-sign"];
  const urls = Object.fromEntries(keys.map(key => ['./pixel/world/objects/' + key + '.png', 'data:decor']));
  expect(createPixelRegistry(urls).map(asset => asset.key).sort()).toEqual(keys.sort());
 });
 it('registers all four-level keys and accepts the map area manifest', () => {
  const keys = ["map-bg","map-node-open","map-node-current","map-node-done","map-node-locked","map-path-dot","bldg-factory-hot","bldg-factory-coolroof","bldg-warehouse-hot","bldg-warehouse-coolroof","tile-construction","decor-cone","icon-heatwave","icon-delivery"];
  const urls = Object.fromEntries(keys.map(key => ['./pixel/map/' + key + '.png', 'data:asset']));
  expect(createPixelRegistry(urls).map(asset => asset.key).sort()).toEqual(keys.sort());
  const record = { key:'map-node-open',file:'src/assets/pixel/map/nodes/open.png',nativeSize:{width:32,height:32},frames:1,anchor:{x:.5,y:.5} };
  expect(createPixelRegistry({'./pixel/map/nodes/open.png':'data:node'},[{assets:[record]}])[0].key).toBe('map-node-open');
  expect(PIXEL_AREAS).toContain('map');
 });
 it('resolves optional map layout without requiring a file', () => {
  expect(resolveMapLayout({})).toBeUndefined();
  const layout = { nodes:[{id:'yesil-baslangic',x:10,y:20}] };
  expect(resolveMapLayout({'./pixel/map/map-layout.json':layout})).toBe(layout);
  expect(MAP_LAYOUT === undefined || typeof MAP_LAYOUT === 'object').toBe(true);
 });
 it('normalizes Windows paths', () => expect(normalizePixelPath('src\\assets\\pixel\\world\\x.png')).toBe('world/x.png'));
 it('only selects classic for classic=1', () => { expect(isClassicMode('?classic=1')).toBe(true); expect(isClassicMode('?classic=0')).toBe(false); expect(isClassicMode('')).toBe(false); });
 it('exports exactly 32 unique palette colors', () => { expect(new Set(MASTER_PALETTE).size).toBe(32); expect(isPaletteColor(0x43c6a5)).toBe(true); expect(isPaletteColor(0)).toBe(false); });
});
