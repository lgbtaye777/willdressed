import { getOutfitConfig } from './outfitConfig.js';

export function getOutfitItems(outfitId) {
  const outfit = getOutfitConfig(outfitId);
  return outfit?.items || [];
}
