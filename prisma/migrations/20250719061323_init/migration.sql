-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitDate" DATETIME,
    "exitPrice" REAL,
    "quantity" INTEGER NOT NULL,
    "fees" REAL,
    "notes" TEXT,
    "tags" TEXT,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "performanceId" INTEGER,
    CONSTRAINT "Trade_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "period" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "profitLoss" REAL NOT NULL,
    "profitLossPercentage" REAL NOT NULL,
    "largestWin" REAL NOT NULL,
    "largestLoss" REAL NOT NULL,
    "averageWin" REAL NOT NULL,
    "averageLoss" REAL NOT NULL,
    "winRate" REAL NOT NULL,
    "spReturn" REAL NOT NULL,
    "outperformance" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Trade_ticker_idx" ON "Trade"("ticker");

-- CreateIndex
CREATE INDEX "Trade_entryDate_idx" ON "Trade"("entryDate");

-- CreateIndex
CREATE INDEX "Trade_exitDate_idx" ON "Trade"("exitDate");

-- CreateIndex
CREATE INDEX "Performance_period_idx" ON "Performance"("period");

-- CreateIndex
CREATE INDEX "Performance_startDate_endDate_idx" ON "Performance"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Performance_period_startDate_endDate_key" ON "Performance"("period", "startDate", "endDate");
