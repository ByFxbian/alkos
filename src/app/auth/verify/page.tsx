'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        if(status === 'loading' || emailSent) return;

        if(status === 'unauthenticated' || !session?.user) {
            router.push('/login');
            return;
        }

        if(!session.user.emailVerified) {
            setEmailSent(true);

            signIn('email', {
                email: session.user.email,
                redirect: false,
            }).then(() => {
                router.push('/verify-request');
            })
        } else {
            router.push('/meine-termine');
        }
    }, [session, status, router, emailSent]);

    return (
        <div className="container mx-auto py-20 px-4 text-center">
            <h1 className="text-3xl font-bold">Bitte einen Moment Geduld...</h1>
            <p style={{ color: 'var(--color-text-muted)'}}>Du wirst weitergeleitet.</p>
        </div>
    );
}