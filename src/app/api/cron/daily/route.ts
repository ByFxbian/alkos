import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { Resend } from "resend";
import { addHours, subHours, startOfDay, endOfDay } from "date-fns";
import { logger } from "@/lib/logger";
import ReminderEmail from "@/emails/ReminderEmail";
import ReviewEmail from "@/emails/ReviewEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const GOOGLE_REVIEW_LINK = "https://search.google.com/local/writereview?placeid=ChIJwyyu7aGpbUcRZk8P-UB-LGc";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if(authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    logger.info("CRON Daily: Job started.");
    const results = { reminders: 0, reviews: 0, errors: 0 };

    try {
        const now = new Date();

        const reminderStart = addHours(now, 20); 
        const reminderEnd = addHours(now, 48);

        const appointmentsReminders = await prisma.appointment.findMany({
            where: {
                startTime: { gte: reminderStart, lt: reminderEnd },
                reminderSentAt: null,
            },
            include: { customer: true, barber: true, service: true }
        });

        for (const app of appointmentsReminders) {
            try {
                if (app.customer.email) {
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
                    
                    await prisma.appointment.update({
                        where: { id: app.id },
                        data: { reminderSentAt: new Date() }
                    });
                    results.reminders++;
                }
            } catch (e) {
                logger.error("CRON Daily: Reminder Error", { id: app.id, error: e });
                results.errors++;
            }
        }

        const reviewWindowStart = subHours(now, 25);
        const reviewWindowEnd = now;

        const appointmentsReviews = await prisma.appointment.findMany({
            where: {
                endTime: { gte: reviewWindowStart, lt: reviewWindowEnd },
                reviewEmailSentAt: null,
                isFree: false,
            },
            include: { customer: true, barber: true }
        });

        for (const app of appointmentsReviews) {
            try {
                if (app.customer.email) {
                    await resend.emails.send({
                        from: 'ALKOS <contact@alkosbarber.at>',
                        to: app.customer.email,
                        subject: 'Wie war dein Schnitt bei ALKOS?',
                        react: ReviewEmail({
                            customerName: app.customer.name || 'Kunde',
                            barberName: app.barber.name || 'uns',
                            reviewLink: GOOGLE_REVIEW_LINK
                        }),
                    });

                    await prisma.appointment.update({
                        where: { id: app.id },
                        data: { reviewEmailSentAt: new Date() }
                    });
                    results.reviews++;
                }
            } catch (e) {
                logger.error("CRON Daily: Review Error", { id: app.id, error: e });
                results.errors++;
            }
        }

        logger.info("CRON Daily: Finished.", results);
        await logger.flush();
        
        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        logger.error("CRON Daily: Critical Failure", { error });
        await logger.flush();
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}