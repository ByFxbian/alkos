import { PrismaClient, Role } from "@/generated/prisma";
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';

async function main() {
    console.log(`Start seeding ...`);

    await prisma.service.deleteMany();

  const service1 = await prisma.service.create({
    data: {
      name: 'Haarschnitt',
      duration: 20,
      price: 28.00,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: 'Bart',
      duration: 15,
      price: 17.00,
    },
  });

   const service3 = await prisma.service.create({
    data: {
      name: 'Combo',
      duration: 30,
      price: 45.00,
    },
  });

  const service4 = await prisma.service.create({
    data: {
      name: 'Augenbrauen',
      duration: 15,
      price: 7.00,
    },
  });
  const service5 = await prisma.service.create({
    data: {
      name: 'Dauerwelle',
      duration: 120,
      price: 145.00,
    },
  });
  const service6 = await prisma.service.create({
    data: {
      name: 'Traditionelle Rasur',
      duration: 20,
      price: 15.00,
    },
  });
  const service7 = await prisma.service.create({
    data: {
      name: 'ALKOS VIP Paket',
      duration: 90,
      price: 75.00,
    },
  });

  console.log(`Seeding finished.`);
  console.log({ service1, service2, service3, service4, service5, service6, service7 });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });