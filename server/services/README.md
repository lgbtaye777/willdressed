# server/services

Backend business logic.

Use this folder for:

* cart merging
* order creation
* newsletter subscription validation
* product lookup
* validation
* formatting API responses
* total calculations

Rules:

* Services may use Prisma.
* Services should be testable without UI.
* Keep price logic here, not only on frontend.
* For orders, calculate totals server-side.
* Prefer clear errors over silent failures.

Cart/order rule:

```txt
price = unit price
qty = quantity
lineTotal = price * qty
total = sum(lineTotal)
```

Do not trust frontend product price/name when creating orders if `productId` or `slug` is available.
