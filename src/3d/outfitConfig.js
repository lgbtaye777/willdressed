export const OUTFIT_CONFIG = {
  newArrivalsLook: {
    id: 'newArrivalsLook',
    name: 'Latest Drops Look',
    items: ['hat', 'dress'],
  },
};

export function getOutfitConfig(outfitId) {
  return OUTFIT_CONFIG[outfitId] || null;
}
