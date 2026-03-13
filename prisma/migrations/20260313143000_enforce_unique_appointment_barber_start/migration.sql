-- Enforce one appointment per barber at an exact start time.
-- Safe for production: this migration does not delete or modify existing rows.
-- If duplicate rows exist, index creation will fail and the migration will abort.
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_barberId_startTime_key"
ON "Appointment"("barberId", "startTime");

-- Old non-unique index becomes redundant after the unique index above.
DROP INDEX IF EXISTS "Appointment_barberId_startTime_idx";
