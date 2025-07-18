import { prisma } from "@/lib/prisma";
import BookingForm from "./BookingForm";
import { Role } from "@/generated/prisma";

export default async function TerminePage() {
    const barbers = await prisma.user.findMany({
        where: { role: Role.FRISEUR },
    });

    const services = await prisma.service.findMany();

    return (
        <BookingForm barbers={barbers} services={services} />
    );
}