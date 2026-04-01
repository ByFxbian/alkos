
ALTER TABLE "User" ADD COLUMN     "barberPin" TEXT;

CREATE TABLE "ManualEntry" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "notes" TEXT,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManualEntry_barberId_date_idx" ON "ManualEntry"("barberId", "date");

CREATE INDEX "ManualEntry_locationId_idx" ON "ManualEntry"("locationId");

ALTER TABLE "ManualEntry" ADD CONSTRAINT "ManualEntry_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ManualEntry" ADD CONSTRAINT "ManualEntry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
