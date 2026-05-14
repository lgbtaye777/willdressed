import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupControls } from './setupControls.js';
import { setupLights } from './setupLights.js';

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

export function createScene(container, config) {
  const scene = new THREE.Scene();
  const width = container.clientWidth || 300;
  const height = container.clientHeight || 260;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const isStaticViewport = isMobile || window.matchMedia('(pointer: coarse)').matches;

  const camera = new THREE.PerspectiveCamera(
    config.camera?.fov || 35,
    width / height,
    0.01,
    100,
  );

  camera.position.set(
    config.camera?.position?.x ?? 0,
    config.camera?.position?.y ?? 0,
    config.camera?.position?.z ?? 3,
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    powerPreference: 'low-power',
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  setupLights(scene);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(
    config.camera?.target?.x ?? 0,
    config.camera?.target?.y ?? 0,
    config.camera?.target?.z ?? 0,
  );
  setupControls(controls, config.controls);
  if (isStaticViewport) {
    controls.autoRotate = false;
    controls.enabled = false;
  }

  let model = null;
  let frameId = null;
  let isRunning = false;
  let isDisposed = false;
  const clock = new THREE.Clock();

  function setModel(object) {
    model = object;
    scene.add(model);
    renderOnce();
  }

  function renderOnce() {
    if (isDisposed) return;

    config.onBeforeRender?.({
      model,
      scene,
      camera,
      renderer,
      controls,
      elapsed: clock.getElapsedTime(),
    });

    if (controls.autoRotate) {
      controls.update();
    }

    renderer.render(scene, camera);
  }

  function animate() {
    if (!isRunning || isDisposed) return;

    frameId = requestAnimationFrame(animate);
    renderOnce();
  }

  function start() {
    if (isRunning || isDisposed) return;
    if (isStaticViewport) {
      renderOnce();
      return;
    }
    isRunning = true;
    animate();
  }

  function stop() {
    isRunning = false;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function resize() {
    if (isDisposed) return;

    const nextWidth = container.clientWidth || 300;
    const nextHeight = container.clientHeight || 260;

    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(nextWidth, nextHeight);
    renderOnce();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  return {
    scene,
    camera,
    renderer,
    controls,
    setModel,
    resize,
    renderOnce,
    start,
    stop,
    destroy() {
      stop();
      resizeObserver.disconnect();
      controls.dispose();

      if (model) {
        scene.remove(model);
        if (model.userData?.disposeResources) {
          disposeObject3D(model);
        }
      }

      renderer.dispose();
      container.innerHTML = '';
      isDisposed = true;
    },
  };
}
