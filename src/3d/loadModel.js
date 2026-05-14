import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { normalizeModel } from './normalizeModel.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelCache = new Map();
const sourceModels = new Set();

function disposeMaterial(material) {
  Object.keys(material).forEach(key => {
    const value = material[key];
    if (value?.isTexture) {
      value.dispose();
    }
  });
  material.dispose();
}

function disposeObject3D(object) {
  object.traverse(child => {
    if (!child.isMesh) return;

    child.geometry?.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

function cloneModel(model) {
  return SkeletonUtils?.clone ? SkeletonUtils.clone(model) : model.clone(true);
}

function loadModelSource(config) {
  if (modelCache.has(config.src)) {
    return modelCache.get(config.src);
  }

  const promise = new Promise((resolve, reject) => {
    loader.load(
      config.src,
      gltf => {
        const model = gltf.scene;

        model.traverse(child => {
          if (!child.isMesh) return;

          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        });

        sourceModels.add(model);
        resolve(model);
      },
      undefined,
      error => {
        console.warn(`[3D] Failed to load GLB: ${config.src}`, error);
        reject(error);
      },
    );
  });

  modelCache.set(config.src, promise);
  return promise;
}

export async function loadModel(config) {
  const sourceModel = await loadModelSource(config);
  const model = cloneModel(sourceModel);
  normalizeModel(model, config);
  return model;
}

export function clearModelCache() {
  sourceModels.forEach(disposeObject3D);
  sourceModels.clear();
  modelCache.clear();
}
