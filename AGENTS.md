
## Purpose

This file helps AI coding agents work with this repository efficiently.

The project is a fashion/storefront prototype. The user usually asks for practical, incremental product work: improve UI, connect frontend to state/API, add small backend pieces, fix bugs, or polish user flows.

Do not treat every request as a reason to redesign the whole project. Prefer small, safe, focused patches.

---

## How to understand user requests

The user often describes features in casual language and may say things like:

- “сделай поинтуитивнее”
- “выглядит не то”
- “как в обычном магазине”
- “подвяжи к базе”
- “чтобы было красиво и аккуратно”
- “не сломать то, что уже работает”

Interpret these as requests for a focused product-level improvement, not a full rewrite.

When the request is vague, inspect the relevant files and infer the smallest useful patch. Avoid asking for clarification unless the task is truly blocked.

Always preserve existing working behavior unless the user explicitly asks to remove it.

---

## Communication style with the user

Respond practically.

Prefer:

- short summary of what you changed
- changed files
- how to test
- known limitations
- next step

Avoid:

- long theory
- generic tutorials
- over-explaining obvious code
- claiming something works without testing
- hiding uncertainty

When proposing work, write in a way the user can paste into Codex or understand as a checklist.

---

## Repository map

Use this map before searching the whole repo.

### Frontend entry

```txt
index.html
src/js/main.js
src/js/app.js
````

`main.js` should stay thin.
`app.js` coordinates feature initialization.

### Frontend features

```txt
src/js/features/
```

Typical places:

```txt
catalog.js              # product catalog rendering
product-modal.js        # product details modal/gallery/size/add-to-cart
cart-drawer.js          # cart UI
checkout.js             # checkout/request UI
fit-finder.js           # measurements form
size-recommendation.js  # size recommendation logic
account-ui.js           # auth/account modal
catalog-3d-hover.js     # 3D hover previews
hero-video.js           # hero video behavior
cursor.js               # custom cursor
fx.js                   # visual effects
```

### Frontend state

```txt
src/js/state/
```

Typical places:

```txt
auth.store.js
profile.store.js
measurements.store.js
cart.store.js
guest.store.js
products.store.js
```

### API clients

```txt
src/js/api/
```

Use existing API wrappers instead of raw `fetch` in feature modules.

### Styles

```txt
src/styles/css/style.css
```

Prefer scoped selectors. Avoid broad global overrides.

### Backend

```txt
server/index.js
server/auth.js
server/prisma.js
server/routes/
server/services/
```

### Database

```txt
prisma/schema.prisma
prisma/seed.js
prisma/migrations/
```

Use migrations for schema changes. Do not edit old migration files unless explicitly needed.

### Static assets

```txt
public/images/products/
public/models/
public/videos/
```

Do not delete or move product assets unless explicitly asked.

---

## Where to look by task type

### UI polish

Look at:

```txt
index.html
src/styles/css/style.css
src/js/features/<relevant-feature>.js
```

Do not start with backend files.

### Catalog issues

Look at:

```txt
src/js/features/catalog.js
src/js/api/products.api.js
server/routes/products*
server/services/products*
prisma/seed.js
```

### Product modal issues

Look at:

```txt
src/js/features/product-modal.js
src/js/features/size-recommendation.js
src/js/state/cart.store.js
src/styles/css/style.css
```

### Fit Finder / measurements

Look at:

```txt
src/js/features/fit-finder.js
src/js/state/measurements.store.js
src/js/state/guest.store.js
src/js/state/profile.store.js
src/js/features/size-recommendation.js
```

### Cart issues

Look at:

```txt
src/js/state/cart.store.js
src/js/features/cart-drawer.js
src/js/api/cart.api.js
server/routes/cart*
server/services/cart*
prisma/schema.prisma
```

### Checkout / orders

Look at:

```txt
src/js/features/checkout.js
src/js/api/orders.api.js
server/routes/orders*
server/services/order*
prisma/schema.prisma
```

### Auth/account

Look at:

```txt
src/js/features/account-ui.js
src/js/state/auth.store.js
src/js/state/profile.store.js
src/js/api/auth.api.js
src/js/api/me.api.js
server/auth.js
server/index.js
```

### 3D / performance

Look at:

```txt
src/3d/
src/js/features/catalog-3d-hover.js
src/js/features/performance-mode.js
src/js/features/hero-video.js
```

Do not initialize all 3D models globally.

---

## Implementation principles

### Keep patches narrow

If the user asks for one feature, do not refactor unrelated systems.

Bad:

```txt
“While adding a cart label, rewrite app initialization, CSS architecture, and Prisma schema.”
```

Good:

```txt
“Fix cart label styling, update one feature module, add one scoped CSS block.”
```

### Respect current architecture

Use:

```txt
feature modules
state stores
api wrappers
Prisma services/routes
```

Avoid dumping logic into `index.html`, `main.js`, or one giant module.

### Prefer graceful degradation

For visual/3D features:

* desktop can have richer interactions
* mobile/touch can use simpler behavior
* low-power/reduced-motion should disable heavy effects

### Do not introduce heavy dependencies casually

Avoid adding libraries for:

* small sliders
* simple modals
* basic toasts
* small UI animation

Use vanilla JS/CSS unless there is a strong reason.

---

## Product behavior rules

### Cart

Cart must support:

```txt
guest cart via localStorage
account cart via API/database
guest-to-account sync after login/register
```

Never lose guest cart data if sync fails.

Always calculate totals using:

```txt
lineTotal = item.price * item.qty
total = sum(lineTotal)
```

### Orders

Orders are saved to SQLite through Prisma.

Checkout is a demo request flow:

```txt
no payment
no real delivery
no client-facing Telegram
```

Do not show technical internals to users.

### Measurements

Default slider values are not real user measurements until the user edits/saves them.

Recommended size should appear only when measurements are user-provided or profile-provided.

### Product sizes

For multi-size products, require size selection before add-to-cart.

For one-size products, auto-select one-size.

---

## UI/UX rules

The design should feel like a fashion/editorial storefront, not an admin panel.

Prefer:

```txt
dark editorial UI
soft glass panels
compact forms
large product imagery
clear hierarchy
subtle hover/focus states
Russian UI text where the feature is already Russian
```

Avoid:

```txt
browser-default controls
harsh white blocks
technical success screens
oversized form layouts
mixed Russian/English inside one flow
```

If something “works but feels wrong,” check:

```txt
spacing
typography
button hierarchy
language consistency
empty states
success/error states
whether the UI exposes implementation details
```

---

## Performance rules

Be careful with:

```txt
Three.js
large images
video
blur/backdrop-filter
mousemove handlers
requestAnimationFrame loops
```

Rules:

* lazy-init heavy features
* stop render loops when hidden
* avoid repeated layout reads on mousemove
* do not load every product model on page load
* respect low-power/mobile/reduced-motion modes

---

## Data and safety rules

Do not commit or include:

```txt
.env
.env.*
prisma/dev.db
*.db
node_modules/
dist/
repomix-output.*
```

Do not expose secrets.

Do not store plain-text passwords.

Do not trust frontend prices for backend order totals. Backend should use Product data from DB when possible.

---

## README maintenance

When adding new important files/modules/routes/services/models/asset conventions to documented folders, update the nearest README.

Documented READMEs:

- `src/README.md`
- `src/js/README.md`
- `src/3d/README.md`
- `src/styles/README.md`
- `server/README.md`
- `server/routes/README.md`
- `server/services/README.md`
- `prisma/README.md`
- `public/README.md`

Rules:

* Update README only if the change affects navigation or understanding of structure.
* Do not update for minor internal details.
* Keep READMEs short and practical.

---

## Before editing

First inspect the smallest relevant set of files.

Do not scan or rewrite the entire project if the task only touches one flow.

Example:

For “cart count looks wrong” inspect:

```txt
cart.store.js
cart-drawer.js
checkout.js
style.css
```

Not the whole backend and 3D pipeline.

---

## After editing

Run or recommend the smallest relevant checks.

Common checks:

```bash
npm run build
npm run dev
```

If Prisma schema changed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Report:

```txt
changed files
what changed
how to test
anything not tested
next likely issue
```

---

## Manual testing patterns

### Cart

```txt
Add item
Increase qty
Check unit price × qty
Check total
Reload as guest
Login and verify sync
```

### Checkout

```txt
Add items
Open checkout
Check thumbnails and totals
Submit contact info
Confirm order saved
Confirm cart clears
```

### Fit Finder

```txt
Move sliders
Reload
Check localStorage/profile
Check recommended size in catalog/modal
```

### Product modal

```txt
Open product
Change gallery image
Select size
Add to cart
Check recommended size
```

### 3D hover

```txt
Hover desktop card
Confirm model appears
Mouseleave
Confirm render stops
Check mobile disables hover
```

---

## How to handle unclear requests

If the user says:

```txt
“сделай красиво”
```

Interpret as:

```txt
polish spacing, typography, hierarchy, states, and consistency
```

If the user says:

```txt
“подвяжи”
```

Interpret as:

```txt
connect existing UI to state/API/database without redesigning everything
```

If the user says:

```txt
“как обычный магазин”
```

Interpret as:

```txt
clear product flow, size selection, cart, checkout, saved order
```

If the user says:

```txt
“не нравится, не знаю что”
```

Inspect the UI flow and identify likely issues in:

```txt
layout
typography
button hierarchy
language
technical wording
missing feedback
```

Then propose a focused patch.

---

## Things to avoid

Avoid:

* full rewrites
* unrelated refactors
* new frameworks
* adding payment systems
* adding real delivery systems
* adding Telegram UI
* exposing database/Prisma language in client UI
* loading all 3D assets at once
* broad CSS overrides
* silently changing existing flows
* deleting assets
* committing local DB/env files

```
