import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
    const rawAppointments = await prisma.$queryRaw`SELECT id, "startTime", "locationId" FROM "Appointment" ORDER BY "startTime" ASC LIMIT 10;`;
    console.log("RAW SQL APPOINTMENTS:", rawAppointments);

    const prismaAppointments = await prisma.appointment.findMany({
        take: 10,
        orderBy: { startTime: 'asc' },
        select: { id: true, startTime: true, locationId: true }
    });
    console.log("PRISMA APPOINTMENTS:", JSON.stringify(prismaAppointments));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
