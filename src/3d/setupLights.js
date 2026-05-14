import * as THREE from 'three';

export function setupLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-3, 2, 2);
  scene.add(fill);
}
