import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  console.log("🛠 Starte Reparatur der Locations...");

  let wien = await prisma.location.findUnique({ where: { slug: 'wien' } });
  
  if (!wien) {
      console.log("⚠️ Location 'wien' nicht gefunden. Erstelle sie...");
      wien = await prisma.location.create({
          data: {
              name: 'ALKOS Wien',
              slug: 'wien',
              address: 'Wiedner Gürtel 12',
              city: 'Wien',
              postalCode: '1040',
              heroImage: '/images/hero-bg.jpeg'
          }
      });
  }
  
  console.log(`✅ Ziel-Location: ${wien.name} (${wien.id})`);

  const appUpdate = await prisma.appointment.updateMany({
      where: { locationId: null },
      data: { locationId: wien.id }
  });
  console.log(`📦 ${appUpdate.count} Termine nach Wien verschoben.`);

  const serviceUpdate = await prisma.service.updateMany({
      where: { locationId: null },
      data: { locationId: wien.id }
  });
  console.log(`💇‍♂️ ${serviceUpdate.count} Services nach Wien verschoben.`);

  const users = await prisma.user.findMany({
      where: {
          role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
          locations: { none: {} }
      }
  });

  for (const user of users) {
      await prisma.user.update({
          where: { id: user.id },
          data: {
              locations: { connect: { id: wien.id } }
          }
      });
      console.log(`👤 ${user.name} arbeitet jetzt in Wien.`);
  }

  console.log("🎉 Reparatur abgeschlossen! Dashboard sollte jetzt Daten zeigen.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());