import type { Tool, ToolId } from './types';

export const TOOLS: Record<ToolId, Tool> = {
  tree: {
    id: 'tree', name: 'Ağaç', cost: 40, coolingCenter: 32, coolingNeighbor: 14,
    allowedOn: ['park', 'road'],
    description: 'Ağaçlar gölge ve buharlaşma yoluyla serinlik sağlar; yeşil alanlar çevresini de serinletir.',
  },
  canopy: {
    id: 'canopy', name: 'Gölgelik', cost: 25, coolingCenter: 42, coolingNeighbor: 0,
    allowedOn: ['road'],
    description: 'Gölgelikler güneş ışınlarını keserek yürüyüş yolunda doğrudan gölge sağlar.',
  },
  coolRoof: {
    id: 'coolRoof', name: 'Serin Çatı', cost: 30, coolingCenter: 24, coolingNeighbor: 6,
    allowedOn: ['building'],
    description: 'Açık renkli, yansıtıcı çatılar güneş enerjisinin daha azını soğurur ve çevreye yayılan ısıyı azaltır.',
  },
};
