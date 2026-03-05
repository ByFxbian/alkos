import { prisma } from "@/lib/prisma";
import WalkInBooking from "@/components/WalkInBooking";

export const dynamic = 'force-dynamic';

export default async function WalkInPage() {
  const services = await prisma.service.findMany({
    orderBy: { price: 'asc' },
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
      locationId: true,
    },
  });

  return <WalkInBooking services={services} />;
}
