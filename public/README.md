# public

Static assets served by Vite/Express.

Use this folder for:

* product images
* GLB models
* hero videos
* public static files

Structure:

* `images/` — image assets
* `images/products/` — product folders and gallery images
* `models/` — GLB models
* `videos/` — hero/background videos

Rules:

* Do not put source JS/CSS here.
* Do not put backend code here.
* Use stable web paths:

  * `/images/...` 
  * `/models/...` 
  * `/videos/...` 
* Keep filenames web-safe when possible.
* Do not delete product assets unless explicitly asked.
* Large binaries should be ignored by Repomix, but still exist in the project.

Product images:

* Prefer `thumbnail` if available.
* Fallback to `front`, `front-clean`, `mannequin-front`, or `character-front`.
* Then `side`, `back`, `detail`.
* Then first usable image.

3D models:

* Use `.glb`.
* Prefer latin/kebab-case filenames.
* Update model config/product seed if model paths change.
