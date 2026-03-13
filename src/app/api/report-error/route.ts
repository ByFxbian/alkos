import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);
const reportRecipientEmail = process.env.ERROR_REPORT_EMAIL || 'sopa.fabian@gmx.net';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`report-error:${ip}`, { limit: 10, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: 'Zu viele Meldungen. Bitte warte kurz.' }, { status: 429 });
        }

        const { description, email: reporterEmail } = await req.json();

        if(!description || typeof description !== 'string' || description.trim().length === 0) {
            return NextResponse.json({ error: 'Beschreibung fehlt.' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;

        const subject = `Fehler von ALKOS`;
        let emailBody = `Eine neue Fehlermeldung wurde übermittelt:\n\n`;
        emailBody += `Beschreibung:\n${description}\n\n`;
        if(reporterEmail) {
            emailBody += `Gemeldet von (E-Mail angegeben): ${reporterEmail}\n`;
        }
        if (userId) {
            emailBody += `Eingeloggter User ID: ${userId}\n`;
        }
        if(userEmail) {
            emailBody += `Eingeloggter User E-Mail: ${userEmail}\n`;
        }

        const { error } = await resend.emails.send({
            from: 'Fehlermeldung <noreply@alkosbarber.at>',
            to: [reportRecipientEmail],
            subject: subject,
            text: emailBody,
        });

        if(error) {
            return NextResponse.json({ error: 'Fehler beim Senden der E-Mail.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Meldung erfolgreich gesendet.' }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Ein interner Fehler ist aufgetreten.' }, { status: 500 });
    }
}
