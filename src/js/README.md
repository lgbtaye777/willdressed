# src/js

Frontend JavaScript.

Main files:

* `main.js` — Vite entry, should stay minimal
* `app.js` — initializes frontend features
* `api/` — API wrappers
* `state/` — client-side stores
* `features/` — UI behavior modules
* `config.js` — shared frontend constants/config

Use this folder when working on:

* catalog rendering
* product modal
* cart drawer
* checkout
* newsletter subscription
* Fit Finder
* account modal
* custom cursor
* hero video
* 3D hover integration

Rules:

* Do not put large logic into `main.js`.
* Prefer feature modules in `features/`.
* Prefer state modules in `state/`.
* Prefer API wrappers in `api/`.
* Avoid direct `fetch` calls in feature modules if an API wrapper exists.
* Avoid circular imports. If needed, use DOM custom events.

Typical custom events:

* `measurements:updated` 
* `cart:add` 

Common checks:

* `npm run build` 
* manual browser test through `http://localhost:5173`
