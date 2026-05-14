# src

Frontend source code.

Use this folder when changing:
- page behavior
- client-side state
- product catalog UI
- product modal
- cart drawer
- checkout UI
- Fit Finder
- 3D frontend integration
- visual effects

Structure:

- `js/` — frontend JavaScript modules
- `styles/` — CSS
- `3d/` — Three.js model pipeline

Do not put backend code here.
Do not put static assets here; use `public/` for images, videos, and models.

Main entry flow:

```txt
main.js → app.js → feature modules
```

Keep `main.js` thin.
