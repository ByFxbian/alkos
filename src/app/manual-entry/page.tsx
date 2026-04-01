import ManualEntryPage from "@/components/ManualEntryPage";
import { prisma } from "@/lib/prisma";


export const dynamic = 'force-dynamic';

export default async function ManualEntryRoute() {
  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
      locationId: true,
    },
  });

  return <ManualEntryPage services={services} />;
}
