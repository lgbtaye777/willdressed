import * as THREE from 'three';

export function normalizeModel(model, config = {}) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  model.position.x -= center.x;
  model.position.y -= center.y;
  model.position.z -= center.z;

  const maxAxis = Math.max(size.x, size.y, size.z);
  const targetSize = config.targetSize || 1.8;
  const baseScale = maxAxis > 0 ? targetSize / maxAxis : 1;
  const manualScale = config.scale || 1;

  model.scale.setScalar(baseScale * manualScale);

  model.position.x += config.position?.x ?? 0;
  model.position.y += config.position?.y ?? 0;
  model.position.z += config.position?.z ?? 0;

  model.rotation.x = config.rotation?.x ?? 0;
  model.rotation.y = config.rotation?.y ?? 0;
  model.rotation.z = config.rotation?.z ?? 0;

  return model;
}
