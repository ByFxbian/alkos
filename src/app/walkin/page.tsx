import { prisma } from "@/lib/prisma";
import WalkInBooking from "@/components/WalkInBooking";

export const dynamic = 'force-dynamic';

export default async function WalkInPage() {
  const services = await prisma.service.findMany({
    orderBy: { price: 'asc' },
  });

  return <WalkInBooking services={services} />;
}
