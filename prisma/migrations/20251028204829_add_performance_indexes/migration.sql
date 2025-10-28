-- CreateIndex
CREATE INDEX "Appointment_barberId_startTime_idx" ON "Appointment"("barberId", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_customerId_startTime_idx" ON "Appointment"("customerId", "startTime");

-- CreateIndex
CREATE INDEX "Availability_barberId_dayOfWeek_idx" ON "Availability"("barberId", "dayOfWeek");
