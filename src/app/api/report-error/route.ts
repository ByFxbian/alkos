import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const reportRecipientEmail = process.env.ERROR_REPORT_EMAIL || 'sopa.fabian@gmx.net';

export async function POST(req: Request) {
    console.log("API ROUTE /api/report-error POST called");
    try {
        const { description, email: reporterEmail } = await req.json();

        if(!description || typeof description !== 'string' || description.trim().length === 0) {
            return NextResponse.json({ error: 'Beschreibung fehlt.' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;

        const subject = `Fehler von ALKOS`;
        let emailBody = `Eine neue Fehlermeldung wurde übermittel:\n\n`;
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

        const { data, error } = await resend.emails.send({
            from: 'Fehlermeldung <noreply@alkosbarber.at>',
            to: [reportRecipientEmail],
            subject: subject,
            text: emailBody,
        });

        if(error) {
            console.error("Resend error sending report: ", error);
            return NextResponse.json({ error: 'Fehler beim Senden der E-Mail.' }, { status: 500 });
        }

        console.log("API Route /api/report-error: Report sent successfully.", { emailId: data?.id });
        return NextResponse.json({ message: 'Meldung erfolgreich gesendet.' }, { status: 200 });
    } catch (error) {
        console.error('API Route /api/report-error - General error:', error);
        return NextResponse.json({ error: 'Ein interner Fehler ist aufgetreten.' }, { status: 500 });
    }
}