/*
  Warnings:

  - You are about to alter the column `quantity` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitDate" DATETIME,
    "exitPrice" REAL,
    "quantity" REAL NOT NULL,
    "fees" REAL,
    "notes" TEXT,
    "tags" TEXT,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" REAL,
    "patternMatched" TEXT,
    "aiRecommendation" TEXT,
    "emotionalState" TEXT,
    "marketConditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "performanceId" INTEGER,
    CONSTRAINT "Trade_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("aiRecommendation", "confidenceScore", "createdAt", "emotionalState", "entryDate", "entryPrice", "exitDate", "exitPrice", "fees", "id", "isShort", "marketConditions", "notes", "patternMatched", "performanceId", "quantity", "tags", "ticker", "updatedAt") SELECT "aiRecommendation", "confidenceScore", "createdAt", "emotionalState", "entryDate", "entryPrice", "exitDate", "exitPrice", "fees", "id", "isShort", "marketConditions", "notes", "patternMatched", "performanceId", "quantity", "tags", "ticker", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_ticker_idx" ON "Trade"("ticker");
CREATE INDEX "Trade_entryDate_idx" ON "Trade"("entryDate");
CREATE INDEX "Trade_exitDate_idx" ON "Trade"("exitDate");
CREATE INDEX "Trade_patternMatched_idx" ON "Trade"("patternMatched");
CREATE INDEX "Trade_confidenceScore_idx" ON "Trade"("confidenceScore");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
