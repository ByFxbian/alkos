import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signIn } from "next-auth/react";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { Resend } from "resend";
import VerificationEmail from "@/emails/VerificationEmail";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
    const session = await getServerSession(authOptions);

    if(!session?.user?.email) {
        return NextResponse.json({ error: 'Nicht autorisiert '}, { status: 401 });
    }

    try {
        const { email } = session.user;
        const url = new URL(process.env.NEXTAUTH_URL!);

        const token = crypto.randomBytes(32).toString("hex")
        const expires = new Date()
        expires.setHours(expires.getHours() + 24)

        await prisma.verificationToken.create({
            data: { identifier: email, token, expires },
        });

        const verificationUrl = `${url}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}`

        await resend.emails.send({
            from: 'contact@alkosbarber.at',
            to: email,
            subject: "Bestätige deine E-Mail Adresse für ALKOS",
            react: VerificationEmail({ url: verificationUrl, host: url.host }),
        });

        return NextResponse.json({message: 'E-Mail versendet'});
    } catch (error) {
        console.error("Fehler beim Senden der Verifizierungs E-Mail: ", error);
        return NextResponse.json({ error: 'Fehler beim Senden der E-Mail '}, { status: 500 })
    }
}