-- CreateTable
CREATE TABLE "PerformanceLog" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "network" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceLog_metric_idx" ON "PerformanceLog"("metric");

-- CreateIndex
CREATE INDEX "PerformanceLog_path_idx" ON "PerformanceLog"("path");
