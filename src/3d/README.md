# src/3d

Three.js model pipeline.

Use this folder when changing:

* model loading
* scene setup
* lighting
* controls
* model normalization
* 3D product previews
* Latest Drops 3D behavior

Important files:

* `createScene.js` — scene/renderer lifecycle
* `loadModel.js` — GLB loading
* `normalizeModel.js` — model scaling/positioning
* `initModelViewers.js` — viewport-based 3D initialization
* `modelConfig.js` — model configs
* `setupControls.js` — controls
* `setupLights.js` — lights

Performance rules:

* Do not load all models on page load.
* Do not start render loops for hidden elements.
* Stop render loops on mouseleave/close/visibilitychange.
* Disable heavy 3D on mobile/touch/low-power/reduced-motion.
* Keep Latest Drops 3D and catalog hover 3D independent.
* Do not break existing model config keys.

Static model files are in:

```txt
public/models/
```

Do not move model files from `public/models/` without updating config paths.
