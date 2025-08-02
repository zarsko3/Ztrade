/*
  Warnings:

  - The primary key for the `MLModel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Performance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Trade` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TradeInsight` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TradePattern` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TradePrediction` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);

-- Create default user for existing data
INSERT INTO "User" ("id", "username", "password", "email", "name", "isActive", "role", "createdAt", "updatedAt") 
VALUES ('default-user-id', 'default', '$2a$12$default.hash.for.existing.data', 'default@example.com', 'Default User', true, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MLModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "accuracyScore" REAL,
    "lastTrained" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "modelPath" TEXT,
    "parameters" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MLModel" ("accuracyScore", "createdAt", "id", "isActive", "lastTrained", "modelName", "modelPath", "modelType", "modelVersion", "parameters", "updatedAt", "userId") SELECT "accuracyScore", "createdAt", "id", "isActive", "lastTrained", "modelName", "modelPath", "modelType", "modelVersion", "parameters", "updatedAt", 'default-user-id' FROM "MLModel";
DROP TABLE "MLModel";
ALTER TABLE "new_MLModel" RENAME TO "MLModel";
CREATE INDEX "MLModel_userId_idx" ON "MLModel"("userId");
CREATE INDEX "MLModel_modelName_idx" ON "MLModel"("modelName");
CREATE INDEX "MLModel_modelType_idx" ON "MLModel"("modelType");
CREATE INDEX "MLModel_isActive_idx" ON "MLModel"("isActive");
CREATE UNIQUE INDEX "MLModel_userId_modelName_modelVersion_key" ON "MLModel"("userId", "modelName", "modelVersion");
CREATE TABLE "new_Performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
INSERT INTO "new_Performance" ("averageLoss", "averageWin", "createdAt", "endDate", "id", "largestLoss", "largestWin", "losingTrades", "outperformance", "period", "profitLoss", "profitLossPercentage", "spReturn", "startDate", "totalTrades", "updatedAt", "winRate", "winningTrades", "userId") SELECT "averageLoss", "averageWin", "createdAt", "endDate", "id", "largestLoss", "largestWin", "losingTrades", "outperformance", "period", "profitLoss", "profitLossPercentage", "spReturn", "startDate", "totalTrades", "updatedAt", "winRate", "winningTrades", 'default-user-id' FROM "Performance";
DROP TABLE "Performance";
ALTER TABLE "new_Performance" RENAME TO "Performance";
CREATE INDEX "Performance_userId_idx" ON "Performance"("userId");
CREATE INDEX "Performance_period_idx" ON "Performance"("period");
CREATE INDEX "Performance_startDate_endDate_idx" ON "Performance"("startDate", "endDate");
CREATE UNIQUE INDEX "Performance_userId_period_startDate_endDate_key" ON "Performance"("userId", "period", "startDate", "endDate");
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "userId" TEXT NOT NULL,
    "confidenceScore" REAL,
    "patternMatched" TEXT,
    "aiRecommendation" TEXT,
    "emotionalState" TEXT,
    "marketConditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "performanceId" TEXT,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("aiRecommendation", "confidenceScore", "createdAt", "emotionalState", "entryDate", "entryPrice", "exitDate", "exitPrice", "fees", "id", "isShort", "marketConditions", "notes", "patternMatched", "performanceId", "quantity", "tags", "ticker", "updatedAt", "userId") SELECT "aiRecommendation", "confidenceScore", "createdAt", "emotionalState", "entryDate", "entryPrice", "exitDate", "exitPrice", "fees", "id", "isShort", "marketConditions", "notes", "patternMatched", "performanceId", "quantity", "tags", "ticker", "updatedAt", 'default-user-id' FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");
CREATE INDEX "Trade_ticker_idx" ON "Trade"("ticker");
CREATE INDEX "Trade_entryDate_idx" ON "Trade"("entryDate");
CREATE INDEX "Trade_exitDate_idx" ON "Trade"("exitDate");
CREATE INDEX "Trade_patternMatched_idx" ON "Trade"("patternMatched");
CREATE INDEX "Trade_confidenceScore_idx" ON "Trade"("confidenceScore");
CREATE TABLE "new_TradeInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "insightText" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeInsight_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TradeInsight" ("confidenceScore", "createdAt", "id", "insightText", "insightType", "tradeId") SELECT "confidenceScore", "createdAt", "id", "insightText", "insightType", "tradeId" FROM "TradeInsight";
DROP TABLE "TradeInsight";
ALTER TABLE "new_TradeInsight" RENAME TO "TradeInsight";
CREATE INDEX "TradeInsight_tradeId_idx" ON "TradeInsight"("tradeId");
CREATE INDEX "TradeInsight_insightType_idx" ON "TradeInsight"("insightType");
CREATE INDEX "TradeInsight_confidenceScore_idx" ON "TradeInsight"("confidenceScore");
CREATE INDEX "TradeInsight_createdAt_idx" ON "TradeInsight"("createdAt");
CREATE TABLE "new_TradePattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "patternName" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "tradeIds" TEXT NOT NULL,
    "description" TEXT,
    "performance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TradePattern" ("confidenceScore", "createdAt", "description", "id", "patternName", "patternType", "performance", "tradeIds", "updatedAt", "userId") SELECT "confidenceScore", "createdAt", "description", "id", "patternName", "patternType", "performance", "tradeIds", "updatedAt", 'default-user-id' FROM "TradePattern";
DROP TABLE "TradePattern";
ALTER TABLE "new_TradePattern" RENAME TO "TradePattern";
CREATE INDEX "TradePattern_userId_idx" ON "TradePattern"("userId");
CREATE INDEX "TradePattern_patternType_idx" ON "TradePattern"("patternType");
CREATE INDEX "TradePattern_confidenceScore_idx" ON "TradePattern"("confidenceScore");
CREATE INDEX "TradePattern_createdAt_idx" ON "TradePattern"("createdAt");
CREATE TABLE "new_TradePrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "predictedValue" REAL NOT NULL,
    "actualValue" REAL,
    "confidenceScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradePrediction_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TradePrediction" ("actualValue", "confidenceScore", "createdAt", "id", "predictedValue", "predictionType", "tradeId") SELECT "actualValue", "confidenceScore", "createdAt", "id", "predictedValue", "predictionType", "tradeId" FROM "TradePrediction";
DROP TABLE "TradePrediction";
ALTER TABLE "new_TradePrediction" RENAME TO "TradePrediction";
CREATE INDEX "TradePrediction_tradeId_idx" ON "TradePrediction"("tradeId");
CREATE INDEX "TradePrediction_predictionType_idx" ON "TradePrediction"("predictionType");
CREATE INDEX "TradePrediction_confidenceScore_idx" ON "TradePrediction"("confidenceScore");
CREATE INDEX "TradePrediction_createdAt_idx" ON "TradePrediction"("createdAt");
CREATE TABLE "new__TradePatterns" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TradePatterns_A_fkey" FOREIGN KEY ("A") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TradePatterns_B_fkey" FOREIGN KEY ("B") REFERENCES "TradePattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__TradePatterns" ("A", "B") SELECT "A", "B" FROM "_TradePatterns";
DROP TABLE "_TradePatterns";
ALTER TABLE "new__TradePatterns" RENAME TO "_TradePatterns";
CREATE UNIQUE INDEX "_TradePatterns_AB_unique" ON "_TradePatterns"("A", "B");
CREATE INDEX "_TradePatterns_B_index" ON "_TradePatterns"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
