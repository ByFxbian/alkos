import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { cache } from "react";
import BookingForm from "@/components/BookingForm";
import { notFound } from "next/navigation";

export const revalidate = 3600;

const getBarbers = cache(() => {
    return prisma.user.findMany({
        where: { role: { in: ['BARBER', 'HEADOFBARBER'] } }
    });
});

const getServices = cache(() => {
    return prisma.service.findMany();
});

export default async function TerminePage({ params }: { params: Promise<{ location: string }> }) {
    const { location: slug } = await params;

    const locationObj = await prisma.location.findUnique({
        where: { slug },
    });

    if (!locationObj) return notFound();

    const services = await prisma.service.findMany({
        where: { locationId: locationObj.id },
        orderBy: { price: 'asc' },
    });

    const barbers = await prisma.user.findMany({
        where: {
        role: { in: ['BARBER', 'HEADOFBARBER'] },
        isBlocked: false,
        locations: {
            some: {
            id: locationObj.id
            }
        }
        },
        include: {
            availabilities: true 
        }
    });

    return (
        <div className="min-h-screen">
            <BookingForm 
                barbers={barbers} 
                services={services} 
                hasFreeAppointment={false}
                currentLocationId={locationObj.id}
            />
        </div>
    );

    /*const session = await getServerSession(authOptions);

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
    );*/
}