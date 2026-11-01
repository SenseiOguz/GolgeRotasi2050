import type { GameState, Tile } from '../core/types';
export const DECOR_KEYS = ['decor-bench','decor-lamp','decor-bush','decor-planter','decor-sign'] as const;
export interface DecorPlacement { x: number; y: number; key: typeof DECOR_KEYS[number]; offsetX: number; offsetY: number }
const cellHash = (tile: Tile): number => (Math.imul(tile.x + 1,73856093) ^ Math.imul(tile.y + 1,19349663)) >>> 0;
/** Inset edge positions contain native x2 decor plus its shadow; routes stay clear.
 * Plan ignores interventions so undo restores exactly the same decor.
 */
export function planDecor(state: GameState): DecorPlacement[] {
  const route = new Set(state.level.route.map(p=>`${p.x},${p.y}`));
  const candidates = state.tiles.flat().filter(t=>!route.has(`${t.x},${t.y}`));
  const select = (type: Tile['type'], limit: number) => candidates.filter(t=>t.type===type)
    .sort((a,b)=>cellHash(a)-cellHash(b) || a.y-b.y || a.x-b.x).slice(0,limit);
  return [...select('park',4),...select('building',2)].map((tile,index)=>({
    x:tile.x,y:tile.y,key:DECOR_KEYS[index % DECOR_KEYS.length],offsetX:cellHash(tile)%2 ? -12 : 8,offsetY:34,
  }));
}
export const decorVisible = (tile: Tile): boolean => tile.placed === undefined;
/** Confine background city fragments to gaps between board and HUD/instruction text. */
export const CITY_RING_GAPS = [
  { x:0,y:120,width:30,height:480 },
  { x:32,y:104,width:800,height:14 },
  { x:32,y:602,width:800,height:12 },
] as const;
