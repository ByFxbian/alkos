import { prisma } from "@/lib/prisma";
import BookingForm from "@/components/BookingForm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 0; // Dynamic since barber list includes shift-based barbers


export default async function TerminePage({ params }: { params: Promise<{ location: string }> }) {
    const { location: slug } = await params;

    const locationObj = await prisma.location.findUnique({
        where: { slug },
    });

    if (!locationObj) return notFound();

    const services = await prisma.service.findMany({
        where: { 
            OR: [
                { locationId: locationObj.id },
                { locationId: null }
            ]
        },
        orderBy: { price: 'asc' },
    });


    const permanentBarbers = await prisma.user.findMany({
        where: {
            role: { in: ['BARBER', 'HEADOFBARBER'] },
            isBlocked: false,
            userLocations: {
                some: {
                    locationId: locationObj.id,
                    isBookable: true,
                }
            }
        },
    });


    const permanentBarberIds = new Set(permanentBarbers.map(b => b.id));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shiftOverrides = await prisma.barberShift.findMany({
        where: {
            locationId: locationObj.id,
            date: { gte: today },
        },
        include: {
            barber: true,
        },
        distinct: ['barberId'],
    });

    const shiftBarbers = shiftOverrides
        .filter(s => !permanentBarberIds.has(s.barberId) && !s.barber.isBlocked)
        .map(s => s.barber);


    const allBarbers = [...permanentBarbers, ...shiftBarbers];

    const session = await getServerSession(authOptions);
    let userHasFreeAppointment = false;

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { hasFreeAppointment: true, completedAppointments: true }
        });
        
        if (user) {
            userHasFreeAppointment = user.completedAppointments >= 15 || user.hasFreeAppointment;
        }
    }

    return (
        <div className="min-h-screen">
            <BookingForm 
                barbers={allBarbers} 
                services={services} 
                hasFreeAppointment={userHasFreeAppointment}
                currentLocationId={locationObj.id}
                locationSlug={locationObj.slug}
                locationAddress={locationObj.address ? `ALKOS, ${locationObj.address}, ${locationObj.postalCode} ${locationObj.city}` : undefined}
            />
        </div>
    );
}