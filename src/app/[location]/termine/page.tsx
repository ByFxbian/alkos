import { prisma } from "@/lib/prisma";
import BookingForm from "@/components/BookingForm";
import { notFound } from "next/navigation";

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

    // Get barbers permanently assigned to this location
    const permanentBarbers = await prisma.user.findMany({
        where: {
            role: { in: ['BARBER', 'HEADOFBARBER'] },
            isBlocked: false,
            locations: {
                some: {
                    id: locationObj.id
                }
            }
        },
    });

    // Get barbers with upcoming shift overrides to this location
    // (who are NOT already in the permanent list)
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

    // Combine: permanent barbers + shift-override barbers
    const allBarbers = [...permanentBarbers, ...shiftBarbers];

    return (
        <div className="min-h-screen">
            <BookingForm 
                barbers={allBarbers} 
                services={services} 
                hasFreeAppointment={false}
                currentLocationId={locationObj.id}
                locationSlug={locationObj.slug}
            />
        </div>
    );
}