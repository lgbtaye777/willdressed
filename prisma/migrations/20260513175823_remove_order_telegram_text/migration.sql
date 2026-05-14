/*
  Warnings:

  - You are about to drop the column `telegramText` on the `Order` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "city" TEXT,
    "address" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "total" INTEGER NOT NULL DEFAULT 0,
    "measurements" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "city", "comment", "createdAt", "customerEmail", "customerName", "customerPhone", "id", "measurements", "status", "total", "updatedAt", "userId") SELECT "address", "city", "comment", "createdAt", "customerEmail", "customerName", "customerPhone", "id", "measurements", "status", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
