import { prisma } from "@/lib/prisma";
import BookingForm from "../../components/BookingForm";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { cache } from "react";

export const revalidate = 3600;

const getBarbers = cache(() => {
    return prisma.user.findMany({
        where: { role: { in: ['BARBER', 'HEADOFBARBER'] } }
    });
});

const getServices = cache(() => {
    return prisma.service.findMany();
});

export default async function TerminePage() {
    const session = await getServerSession(authOptions);

    const [barbers, services, currentUser] = await Promise.all([
        getBarbers(),
        getServices(),
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