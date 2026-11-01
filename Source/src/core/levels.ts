import type { LevelData, TileType } from './types';

const legend: Record<string, TileType> = {
  B: 'building', R: 'road', P: 'park', W: 'water', S: 'start', G: 'goal',
};

const neighborhood: LevelData = {
  id: 'yogun-mahalle', name: 'Yoğun Mahalle', cols: 10, rows: 6,
  difficulty: 2, subtitle: 'Siparişler ve karmaşık rota',
  objectives: ['Siparişler ve karmaşık rota', 'Üç teslimat durağına güvenle ulaş.'],
  deliveries: [{ x: 2, y: 2 }, { x: 5, y: 3 }, { x: 8, y: 4 }],
  stars: { margin2: .015, margin3: .05, savings: .025, eff2: 1.6, eff3: 1.65 },
  tiles: [
    'BBBPBBBWBB',
    'PBBPBBBWBP',
    'SRRRRRBPBB',
    'PBPBBRBBPB',
    'BBWPBRRRRG',
    'BBWPBBPPBB',
  ].map(row => [...row].map(cell => legend[cell])),
  baseHeat: [
    [78, 82, 86, 42, 88, 90, 84, 18, 80, 78],
    [40, 78, 84, 44, 90, 94, 86, 20, 82, 40],
    [58, 72, 82, 92, 96, 94, 88, 42, 84, 80],
    [38, 80, 46, 88, 94, 96, 92, 86, 42, 82],
    [76, 80, 18, 40, 88, 94, 90, 86, 78, 58],
    [74, 78, 16, 38, 84, 86, 42, 40, 80, 76],
  ],
  route: [
    { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
    { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
    { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 6, y: 4 },
    { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 },
  ],
  budget: 180, heatThreshold: 740,
  tools: ['tree', 'canopy', 'coolRoof'],
  eduCardIds: ['trees', 'shade', 'roofs', 'heat-island'],
};

function layout(rows: string[]): TileType[][] {
  return rows.map(row => [...row].map(cell => legend[cell]));
}
const tutorial: LevelData = {
  id: 'yesil-baslangic', name: 'Yeşil Başlangıç', difficulty: 1,
  subtitle: 'Üç araçla serin bir rota kur', cols: 10, rows: 6,
  tiles: layout(['WWWWWWWWWW','WWBPPBWWWW','WSRRRGWWWW','WWBPPBWWWW','WWWWWWWWWW','WWWWWWWWWW']),
  baseHeat: Array.from({length: 6}, (_, y) => Array.from({length: 10}, (_, x) =>
    y === 2 && x >= 1 && x <= 5 ? 78 : 35)),
  route: [1,2,3,4,5].map(x => ({x,y:2})), budget: 150, heatThreshold: 300,
  tools: ['tree','canopy','coolRoof'], eduCardIds: ['trees','shade','roofs'],
  objectives: ['Ağaç: yol ve parklarda çevresini serinletir.', 'Gölgelik: yol hücresine güçlü gölge verir.', 'Serin çatı: binaları ve komşularını serinletir.'],
  stars: {margin2:.10,margin3:.20,savings:.10,eff2:1,eff3:1.4},
};
const industrial: LevelData = {
  id: 'sanayi-krizi', name: 'Sanayi Krizi', difficulty: 3,
  subtitle: 'Sıcak vardiya, kapalı şantiyeler', cols: 10, rows: 6,
  tiles: layout(['BBBBBBBBBB','BBBPBBBBBB','SRRRRRRBBB','BBBBBBRBBB','BBBPBBRRRG','BBBBBBBBBB']),
  baseHeat: Array.from({length:6}, (_,y) => Array.from({length:10}, (_,x) =>
    y === 2 || (x >= 6 && y >= 3 && y <= 4) ? 78 : 88)),
  route: [{x:0,y:2},...[1,2,3,4,5,6].map(x=>({x,y:2})),{x:6,y:3},...[6,7,8,9].map(x=>({x,y:4}))],
  budget:175, heatThreshold:738, tools:['tree','canopy','coolRoof'],
  heatWave:{fromStep:3,toStep:8,bonus:12},
  blockedCells:[{x:3,y:1},{x:4,y:3},{x:7,y:3}],
  objectives:['Isı dalgası sırasında rota daha sıcaktır.', 'İnşaat alanlarına araç yerleştirilemez.'],
  eduCardIds:['heat-island','shade'],
  stars:{margin2:.01,margin3:.03,savings:0,eff2:1.5,eff3:1.65},
};
const critical: LevelData = {
  id:'kritik-esik', name:'Kritik Eşik', difficulty:4,
  subtitle:'Son sipariş, dar bütçe', cols:10, rows:6,
  tiles:layout(['BBBBBBBBBB','BBBBBBBBBB','SRRRRRBBBB','BBBBBRBBBB','BBBBBRRRRG','BBBBBBBBBB']),
  baseHeat:Array.from({length:6},()=>Array<number>(10).fill(73)),
  route:neighborhood.route.map(cell=>({...cell})), budget:170, heatThreshold:740,
  tools:['tree','canopy','coolRoof'], heatWave:{fromStep:2,toStep:9,bonus:12},
  blockedCells:[{x:3,y:1},{x:4,y:3},{x:6,y:3},{x:7,y:5}],
  toolLimits:{tree:2,canopy:4,coolRoof:2},
  deliveries:[{x:3,y:2},{x:5,y:4},{x:8,y:4}],
  objectives:['Sınırlı araçlarla üç siparişi tamamla.', 'Isı dalgası ve inşaat alanlarını hesaba kat.'],
  eduCardIds:['heat-island','trees'],
  stars:{margin2:.005,margin3:.018,savings:.05,eff2:1.5,eff3:1.58},
};
export const LEVELS: LevelData[] = [tutorial, neighborhood, industrial, critical];

/** Unknown IDs return undefined so callers can handle unavailable levels. */
export function getLevel(id: string): LevelData | undefined {
  return LEVELS.find(level => level.id === id);
}
