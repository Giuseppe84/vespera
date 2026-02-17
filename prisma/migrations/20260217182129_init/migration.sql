-- CreateEnum
CREATE TYPE "FilamentStatus" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "FilamentBrand" AS ENUM ('BAMBU', 'PRUSAMENT', 'ESUN', 'HATCHBOX', 'POLYMAKER', 'SUNLU', 'OVERTURE', 'GENERIC', 'OTHER');

-- CreateTable
CREATE TABLE "filaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" "FilamentBrand" NOT NULL DEFAULT 'GENERIC',
    "material" "MaterialType" NOT NULL DEFAULT 'PLA',
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "diameter" DOUBLE PRECISION NOT NULL DEFAULT 1.75,
    "spoolWeightGrams" INTEGER NOT NULL DEFAULT 1000,
    "remainingGrams" INTEGER NOT NULL,
    "density" DOUBLE PRECISION,
    "printTempMin" INTEGER,
    "printTempMax" INTEGER,
    "bedTempMin" INTEGER,
    "bedTempMax" INTEGER,
    "dryingTempMin" INTEGER,
    "dryingTempHours" INTEGER,
    "purchasePrice" DECIMAL(10,2),
    "purchaseDate" TIMESTAMP(3),
    "supplier" TEXT,
    "supplierUrl" TEXT,
    "batchCode" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "status" "FilamentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filament_usage_logs" (
    "id" TEXT NOT NULL,
    "filamentId" TEXT NOT NULL,
    "gramsUsed" DOUBLE PRECISION NOT NULL,
    "printJobName" TEXT,
    "componentId" TEXT,
    "printDuration" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filament_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ComponentFilament" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComponentFilament_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ComponentFilament_B_index" ON "_ComponentFilament"("B");

-- AddForeignKey
ALTER TABLE "filament_usage_logs" ADD CONSTRAINT "filament_usage_logs_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComponentFilament" ADD CONSTRAINT "_ComponentFilament_A_fkey" FOREIGN KEY ("A") REFERENCES "components_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComponentFilament" ADD CONSTRAINT "_ComponentFilament_B_fkey" FOREIGN KEY ("B") REFERENCES "filaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
