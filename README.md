# Willdressed Shop

Fashion/storefront prototype with a Vite frontend, Express API, Prisma, and SQLite.

## What is inside

- `index.html` - frontend markup
- `src/js/` - frontend modules, state stores, and API clients
- `src/styles/css/style.css` - main styles
- `server/` - Express API, auth/session logic, routes, and services
- `prisma/` - schema, migrations, seed data, and local SQLite helpers
- `public/` - product images, videos, and 3D models

## Local setup

```bash
npm install
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
npm run dev
```

Frontend: `http://localhost:5173`

API health check: `http://localhost:3001/api/health`

## Production build

```bash
npm run build
npm start
```

In production, the Express server serves `dist/client` and the API from the same Node process.

## Environment

Create `.env` from `.env.example`:

```env
DATABASE_URL="file:./dev.db"
PORT=3001
```

`prisma/dev.db` is local data and should not be committed.

## GitHub notes

This project has a backend and SQLite database, so GitHub Pages can only host the static frontend and will not run the API. For the full app, push the repository to GitHub and deploy it on a Node-capable platform.

Before pushing, keep out of git:

- `.env`
- `node_modules/`
- `dist/`
- `prisma/dev.db`
- `repomix-output.*`
