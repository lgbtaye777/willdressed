export function setupControls(controls, config = {}) {
  controls.enabled = config.enabled ?? false;
  controls.autoRotate = config.autoRotate ?? true;
  controls.autoRotateSpeed = config.autoRotateSpeed ?? 1;
  controls.enableZoom = config.enableZoom ?? false;
  controls.enablePan = config.enablePan ?? false;
  controls.update();
}
