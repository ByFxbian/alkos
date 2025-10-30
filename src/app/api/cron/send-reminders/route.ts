import { logger } from "@/lib/logger";
import { addHours } from "date-fns";
import { Resend } from "resend";
import { prisma } from '@/lib/prisma';
import { NextResponse } from "next/server";
import ReminderEmail from "@/emails/ReminderEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if(authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        logger.warn("CRON /send-reminders: Unauthorized access attempt.");
        await logger.flush();
        return new Response('Unauthorized', { status: 401 });
    }

    logger.info("CRON /send-reminders: Job started.");

    try {
        const now = new Date();

        const reminderWindowStart = addHours(now, 24);
        const reminderWindowEnd = addHours(now, 48);

        const appointmentsToSend = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: reminderWindowStart,
                    lt: reminderWindowEnd,
                },
                reminderSentAt: null,
            },
            include: {
                customer: true,
                barber: true,
                service: true,
            },
        });

        if(appointmentsToSend.length === 0) {
            logger.info("CRON /send-reminders: No reminders to send.");
            await logger.flush();
            return NextResponse.json({message: 'No reminders to send.'});
        }

        logger.info(`CRON /send-reminders: Found ${appointmentsToSend.length} reminders to send.`);
        const sentEmailIds: string[] = [];
        const failedEmailAppIds: string[] = [];

        for (const app of appointmentsToSend) {
            try {
                await resend.emails.send({
                    from: 'ALKOS <contact@alkosbarber.at>',
                    to: app.customer.email,
                    subject: 'Deine Termin-Erinnerung von ALKOS',
                    react: ReminderEmail({
                        customerName: app.customer.name || '',
                        serviceName: app.service.name,
                        barberName: app.barber.name || '',
                        startTime: app.startTime,
                        host: 'ALKOS'
                    }),
                });
                sentEmailIds.push(app.id);
            } catch(emailError) {
                logger.error("CRON /send-reminders: Failed to send email.", { appointmentId: app.id, error: emailError });
                failedEmailAppIds.push(app.id);
            }
        }

        if (sentEmailIds.length > 0) {
            await prisma.appointment.updateMany({
                where: {
                id: { in: sentEmailIds },
                },
                data: {
                reminderSentAt: new Date(),
                },
            });
            logger.info(`CRON /send-reminders: Marked ${sentEmailIds.length} appointments as sent.`);
        }

        await logger.flush();
        return NextResponse.json({ 
            message: 'Reminder job finished.',
            sent: sentEmailIds.length,
            failed: failedEmailAppIds.length
        });
    } catch (error) {
        logger.error("CRON /send-reminders: Job failed.", { error });
        await logger.flush();
        return NextResponse.json({ error: 'CRON job failed' }, { status: 500 });
    }
}