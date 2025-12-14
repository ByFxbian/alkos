import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from '@react-pdf/renderer';
import { Resend } from 'resend';
import { InvoiceDocument } from "@/components/InvoiceTemplate";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId } = await req.json();

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { customer: true, service: true, barber: true }
    });

    if (!appointment || !appointment.customer.email) {
        return NextResponse.json({ error: "Termin oder Kunden-Email fehlt" }, { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(
        <InvoiceDocument 
            appointmentId={appointment.id}
            date={format(new Date(appointment.startTime), 'dd.MM.yyyy')}
            customerName={appointment.customer.name || 'Kunde'}
            serviceName={appointment.service.name}
            price={appointment.service.price}
            barberName={appointment.barber.name || ''}
        />
    );

    await resend.emails.send({
        from: 'ALKOS <contact@alkosbarber.at>', 
        to: appointment.customer.email,
        subject: `Deine Rechnung von ALKOS`,
        text: 'Anbei findest du deine Rechnung als PDF. Danke für deinen Besuch!',
        attachments: [
            {
                filename: `Rechnung_${format(new Date(appointment.startTime), 'yyyyMMdd')}.pdf`,
                content: pdfBuffer
            }
        ]
    });

    return NextResponse.json({ success: true });
}