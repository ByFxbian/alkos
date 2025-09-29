import { prisma } from "@/lib/prisma";
import BookingForm from "../../components/BookingForm";
import { Role } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export default async function TerminePage() {
    const session = await getServerSession(authOptions);

    const [barbers, services, currentUser] = await Promise.all([
        prisma.user.findMany({ where: { role: Role.BARBER || Role.HEADOFBARBER } }),
        prisma.service.findMany(),
        session ? prisma.user.findUnique({ where: { id: session.user.id }}) : null,
    ]);

    return (
        <BookingForm 
          barbers={barbers} 
          services={services} 
          hasFreeAppointment={currentUser?.hasFreeAppointment || false} 
        />
    );
}