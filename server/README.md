# server

Express backend.

Use this folder when changing:

* API routes
* auth/session logic
* cart API
* order API
* product API
* database access
* backend validation

Important files:

* `index.js` — Express app setup and route registration
* `auth.js` — auth/session helpers and middleware
* `prisma.js` — Prisma client
* `database-url.js` — SQLite path resolution
* `routes/` — HTTP route handlers
* `services/` — backend business logic

Rules:

* Keep route files thin.
* Put business logic in `services/`.
* Use Prisma through `server/prisma.js`.
* Do not return `passwordHash` or session internals.
* Do not trust frontend prices for order totals.
* Keep API responses simple and predictable.

Common checks:

* `http://localhost:3001/api/health` 
* `npm run build` 
* `npm run dev`
