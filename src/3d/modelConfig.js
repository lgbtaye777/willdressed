export const MODEL_CONFIG = {
  hat: {
    id: 'hat',
    name: 'Hat',
    src: '/models/hat.glb',
    alt: '3D model of a hat',
    targetSize: 1.02,
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0.25, z: 0 },
    camera: {
      fov: 32,
      position: { x: 0, y: 0.04, z: 3.2 },
      target: { x: 0, y: 0, z: 0 },
    },
    controls: {
      enabled: false,
      autoRotate: true,
      autoRotateSpeed: 1.4,
      enableZoom: false,
      enablePan: false,
    },
  },
  dress: {
    id: 'dress',
    name: 'Dress',
    src: '/models/dress.glb',
    alt: '3D model of a dress',
    targetSize: 2.34,
    scale: 1,
    position: { x: 0, y: -0.34, z: 0 },
    rotation: { x: 0, y: -0.2, z: 0 },
    camera: {
      fov: 38,
      position: { x: 0, y: 0.02, z: 5.2 },
      target: { x: 0, y: -0.08, z: 0 },
    },
    controls: {
      enabled: false,
      autoRotate: true,
      autoRotateSpeed: 1.1,
      enableZoom: false,
      enablePan: false,
    },
  },
};

export const FUTURE_MODEL_SOURCES = {
  cardigan: '/models/cardigan.glb',
  jeans: '/models/jeans.glb',
  shirtTop: '/models/shirt-top.glb',
  skirtBottom: '/models/skirt-bottom.glb',
  sweaterTop: '/models/sweater-top.glb',
  topUpper: '/models/top-upper.glb',
};

export function getModelConfig(modelId) {
  return MODEL_CONFIG[modelId] || null;
}
