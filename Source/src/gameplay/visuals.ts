import type { Tile } from '../core/types';
/** Visual bands use the real computeHeat result: cool <50, neutral 50-79, hot >=80. */
export const heatBand = (heat: number): 'cool' | 'normal' | 'hot' => heat < 50 ? 'cool' : heat < 80 ? 'normal' : 'hot';
export const heatLevel = (heat: number): number => heat < 25 ? 0 : heat < 50 ? 1 : heat < 80 ? 2 : 3;
export const heatGround = (tile: Tile): boolean => ['road', 'park', 'start', 'goal'].includes(tile.type);
export function groundKey(tile: Tile): string {
  if (tile.type === 'park') return tile.heat < 50 ? 'tile-park-lush' : 'tile-park-dry';
  if (tile.type !== 'road') return `tile-${tile.type}`;
  const band = heatBand(tile.heat);
  return `tile-road${band === 'normal' ? '' : `-${band}`}`;
}
import type { GameState } from '../core/types';
/** Start/goal and explicit route cells connect roads, including future park routes. */
export function roadShape(state: GameState, x: number, y: number): string {
  const connects = (cx: number, cy: number) => ['road','start','goal'].includes(state.tiles[cy]?.[cx]?.type) || state.level.route.some(p => p.x === cx && p.y === cy);
  const n = connects(x,y-1), s = connects(x,y+1), e = connects(x+1,y), w = connects(x-1,y);
  const count = [n,s,e,w].filter(Boolean).length;
  if (count <= 2) {
    if (e && s) return '-corner-es';
    if (e && n) return '-corner-en';
    if (w && s) return '-corner-ws';
    if (w && n) return '-corner-wn';
    if ((n || s) && !e && !w) return '-v';
  }
  return '';
}
export function buildingFamily(x: number, y: number): string {
  return ['house','apartment','commercial','office'][((Math.imul(x + 1,73856093) ^ Math.imul(y + 1,19349663)) >>> 0) % 4];
}
/** Small fractional depth keeps every world object below route/preview/text layers. */
export const worldDepth = (screenY: number): number => 2 + screenY / 1000;

/** Heat-map colors use the same real-heat cool/medium/hot thresholds as variants.
 * Two cool bands retain four dither levels without painting 75-79 heat as hot.
 */
export function heatStyle(heat: number): { color: number; alpha: number; density: number } {
  const level = heatLevel(heat);
  return {color:[0x43c6a5,0x7fe0b8,0xf0c35c,0xf87852][level],alpha:[.42,.42,.4,.5][level],density:[8,8,10,12][level]};
}
/** Stable identity suppresses duplicate UI/initial events; applying never emits. */
export function nextHeatmapVisibility(current: { visible: boolean }, visible: boolean): { visible: boolean } {
  return current.visible === visible ? current : { visible };
}
