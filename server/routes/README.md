# server/routes

Express route handlers.

Use this folder when adding or changing API endpoints.

Routes should:

* parse request input
* call service functions
* return JSON responses
* handle expected status codes

Routes should not:

* contain large business logic
* duplicate Prisma queries that belong in services
* format large domain objects repeatedly

Common route areas:

* auth
* me/profile
* products
* cart
* newsletter
* orders
* health

If adding a route:

1. Create/update route file.
2. Add service function if needed.
3. Register route in `server/index.js`.
4. Test with browser/curl/frontend.
