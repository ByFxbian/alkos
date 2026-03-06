-- CreateTable: UserLocation (explicit join table with isBookable flag)
CREATE TABLE "UserLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data from implicit _UserLocations table
-- Column "B" = userId, Column "A" = locationId in Prisma's implicit table
INSERT INTO "UserLocation" ("id", "userId", "locationId", "isBookable")
SELECT gen_random_uuid(), "B", "A", true
FROM "_UserLocations";

-- CreateIndex
CREATE UNIQUE INDEX "UserLocation_userId_locationId_key" ON "UserLocation"("userId", "locationId");
CREATE INDEX "UserLocation_locationId_idx" ON "UserLocation"("locationId");

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old implicit table (data is safely copied above)
DROP TABLE "_UserLocations";
