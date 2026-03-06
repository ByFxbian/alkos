import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();
async function main() {
    await prisma.userLocation.updateMany({
        where: { user: { name: { contains: 'Fabian' }, role: 'ADMIN' } },
        data: { isBookable: false }
    });
    console.log("✅ Fabian isBookable=false gesetzt");
    const entries = await prisma.userLocation.findMany({
        include: { user: { select: { name: true, role: true } }, location: { select: { name: true } } }
    });
    for (const e of entries) {
        if (['ADMIN', 'HEADOFBARBER'].includes(e.user.role))
            console.log(`  ${e.user.name} (${e.user.role}) → ${e.location.name} | isBookable: ${e.isBookable}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
