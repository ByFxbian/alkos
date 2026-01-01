import { PrismaClient, Role } from "@/generated/prisma";
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';

async function main() {
  console.log("📍 Prüfe/Erstelle Location 'Wien'...")

  const wien = await prisma.location.upsert({
    where: { slug: 'wien' },
    update: {},
    create: {
      name: 'ALKOS',
      slug: 'wien',
      address: 'Wiedner Gürtel 12',
      city: 'Wien',
      postalCode: '1040',
      phone: '+43 660 5783966',
      description: 'Dein Go-To Barbershop in Wien',
      heroImage: '/images/hero-bg.jpeg', 
    },
  })
  console.log(`✅ Location Wien ID: ${wien.id}`)

  console.log("🔄 Migriere Services...")
  await prisma.service.updateMany({
    where: { locationId: null },
    data: { locationId: wien.id }
  })

  console.log("🔄 Verbinde Mitarbeiter mit Wien...")
  const staff = await prisma.user.findMany({
    where: {
      role: { in: [Role.BARBER, Role.HEADOFBARBER, Role.ADMIN] },
      locations: { none: {} }
    }
  })

  for (const user of staff) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        locations: {
          connect: { id: wien.id }
        }
      }
    })
    console.log(`   👤 ${user.name} -> Wien`)
  }

  const baden = await prisma.location.upsert({
    where: { slug: 'baden' },
    update: {},
    create: {
        name: 'Ghost Barber',
        slug: 'baden',
        address: 'Hauptplatz 1',
        city: 'Baden',
        postalCode: '2500',
        heroImage: '/images/baden-bg.jpg', 
    }
  })

  console.log("✅ Migration & Seed abgeschlossen.")
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });