-- CreateTable
CREATE TABLE "StampToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StampToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StampToken_token_key" ON "StampToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "StampToken_appointmentId_key" ON "StampToken"("appointmentId");

-- AddForeignKey
ALTER TABLE "StampToken" ADD CONSTRAINT "StampToken_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
