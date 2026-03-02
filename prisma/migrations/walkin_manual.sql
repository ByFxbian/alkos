-- Add walkInName field to Appointment table
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "walkInName" TEXT;

-- Create Settings table for storing configuration like Walk-In PIN
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- Create unique index on Settings key
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_key_key" ON "Settings"("key");
