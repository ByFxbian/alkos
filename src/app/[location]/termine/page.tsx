import { prisma } from "@/lib/prisma";
import BookingForm from "@/components/BookingForm";
import { notFound } from "next/navigation";

export const revalidate = 3600;


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
}