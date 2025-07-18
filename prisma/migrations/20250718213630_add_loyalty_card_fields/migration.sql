-- AlterTable
ALTER TABLE "User" ADD COLUMN     "completedAppointments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasFreeAppointment" BOOLEAN NOT NULL DEFAULT false;
