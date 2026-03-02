
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');
    const wien = await prisma.location.findFirst({
        where: {
            OR: [
                { slug: 'alkos-wien' },
                { slug: 'wien' },
                { name: { contains: 'Wien', mode: 'insensitive' } }
            ]
        }
    });

    if (!wien) {
        console.error('❌ Could not find location "Wien"!');
        const allLocs = await prisma.location.findMany();
        console.log('Available locations:', allLocs.map(l => `${l.name} (${l.slug})`));
        return;
    }

    console.log(`✅ Found Location: ${wien.name} (ID: ${wien.id})`);
    const appointmentsResult = await prisma.appointment.updateMany({
        where: { locationId: null },
        data: { locationId: wien.id }
    });
    console.log(`Updated ${appointmentsResult.count} appointments.`);

    const servicesResult = await prisma.service.updateMany({
        where: { locationId: null },
        data: { locationId: wien.id }
    });
    console.log(`Updated ${servicesResult.count} services.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
