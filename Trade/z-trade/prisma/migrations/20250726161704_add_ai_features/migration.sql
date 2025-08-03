-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "aiRecommendation" TEXT;
ALTER TABLE "Trade" ADD COLUMN "confidenceScore" REAL;
ALTER TABLE "Trade" ADD COLUMN "emotionalState" TEXT;
ALTER TABLE "Trade" ADD COLUMN "marketConditions" TEXT;
ALTER TABLE "Trade" ADD COLUMN "patternMatched" TEXT;

-- CreateTable
CREATE TABLE "TradePattern" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patternType" TEXT NOT NULL,
    "patternName" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "tradeIds" TEXT NOT NULL,
    "description" TEXT,
    "performance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TradeInsight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tradeId" INTEGER NOT NULL,
    "insightType" TEXT NOT NULL,
    "insightText" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeInsight_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MLModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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

-- CreateTable
CREATE TABLE "TradePrediction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tradeId" INTEGER NOT NULL,
    "predictionType" TEXT NOT NULL,
    "predictedValue" REAL NOT NULL,
    "actualValue" REAL,
    "confidenceScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradePrediction_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TradePatterns" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TradePatterns_A_fkey" FOREIGN KEY ("A") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TradePatterns_B_fkey" FOREIGN KEY ("B") REFERENCES "TradePattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TradePattern_patternType_idx" ON "TradePattern"("patternType");

-- CreateIndex
CREATE INDEX "TradePattern_confidenceScore_idx" ON "TradePattern"("confidenceScore");

-- CreateIndex
CREATE INDEX "TradePattern_createdAt_idx" ON "TradePattern"("createdAt");

-- CreateIndex
CREATE INDEX "TradeInsight_tradeId_idx" ON "TradeInsight"("tradeId");

-- CreateIndex
CREATE INDEX "TradeInsight_insightType_idx" ON "TradeInsight"("insightType");

-- CreateIndex
CREATE INDEX "TradeInsight_confidenceScore_idx" ON "TradeInsight"("confidenceScore");

-- CreateIndex
CREATE INDEX "TradeInsight_createdAt_idx" ON "TradeInsight"("createdAt");

-- CreateIndex
CREATE INDEX "MLModel_modelName_idx" ON "MLModel"("modelName");

-- CreateIndex
CREATE INDEX "MLModel_modelType_idx" ON "MLModel"("modelType");

-- CreateIndex
CREATE INDEX "MLModel_isActive_idx" ON "MLModel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MLModel_modelName_modelVersion_key" ON "MLModel"("modelName", "modelVersion");

-- CreateIndex
CREATE INDEX "TradePrediction_tradeId_idx" ON "TradePrediction"("tradeId");

-- CreateIndex
CREATE INDEX "TradePrediction_predictionType_idx" ON "TradePrediction"("predictionType");

-- CreateIndex
CREATE INDEX "TradePrediction_confidenceScore_idx" ON "TradePrediction"("confidenceScore");

-- CreateIndex
CREATE INDEX "TradePrediction_createdAt_idx" ON "TradePrediction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_TradePatterns_AB_unique" ON "_TradePatterns"("A", "B");

-- CreateIndex
CREATE INDEX "_TradePatterns_B_index" ON "_TradePatterns"("B");

-- CreateIndex
CREATE INDEX "Trade_patternMatched_idx" ON "Trade"("patternMatched");

-- CreateIndex
CREATE INDEX "Trade_confidenceScore_idx" ON "Trade"("confidenceScore");
