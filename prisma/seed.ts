import { PrismaClient, Role } from "@/generated/prisma";
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';

async function main() {
    console.log(`Start seeding ...`);

    await prisma.appointment.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.user.deleteMany(); 
    await prisma.service.deleteMany();

    const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'sopa.fabian@gmx.net',
      name: 'Fabian Admin',
      password: password,
      role: Role.ADMIN,
    },
  });

  const barber1 = await prisma.user.create({
    data: {
      email: 'alen@alkos.at',
      name: 'Alen Alkos',
      password: password,
      role: Role.FRISEUR,
    },
  });

  const barber2 = await prisma.user.create({
    data: {
      email: 'max@mustermann.at',
      name: 'Max Mustermann',
      password: password,
      role: Role.FRISEUR,
    },
  });

  const service1 = await prisma.service.create({
    data: {
      name: 'Klassischer Haarschnitt',
      duration: 30,
      price: 35.00,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: 'Haarschnitt & Bart',
      duration: 60,
      price: 55.00,
    },
  });

   const service3 = await prisma.service.create({
    data: {
      name: 'Dauerwelle',
      duration: 120,
      price: 90.00,
    },
  });

  console.log(`Seeding finished.`);
  console.log({ barber1, barber2, service1, service2, service3 });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });