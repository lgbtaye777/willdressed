# prisma

Database schema, migrations, and seed data.

Use this folder when changing:

* database models
* Product seed data
* size charts
* test products
* migrations

Important files:

* `schema.prisma` — database schema
* `seed.js` — seed products/data
* `migrations/` — generated migration files
* `ensure-sqlite-file.js` — local SQLite helper

Rules:

* Create new migrations for schema changes.
* Do not edit old migrations unless absolutely necessary.
* Do not commit `prisma/dev.db`.
* Do not store secrets here.
* Keep seed data realistic enough for demo.

Current database concepts:

* User
* UserProfile
* Session
* Product
* CartItem
* Order
* OrderItem
* NewsletterSubscriber

Useful commands:

* `npm run prisma:migrate` 
* `npm run prisma:generate`
* `npm run prisma:seed` 
* `npx prisma studio` 

SQLite database is local development data and should not be committed.
