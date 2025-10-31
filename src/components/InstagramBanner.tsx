'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = 'hideInstaBanner';

export default function InstagramBanner() {
    const { data: session, status } = useSession();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
        if (isDismissed) {
            setIsVisible(false);
            return;
        }
        if (
            status === 'authenticated' &&
            !session.user?.instagram
        ) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }

    }, [session, status]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    }

    if (!isVisible) {
        return null;
    } 

    return (
        <div className="relative px-4 py-3 text-center text-sm" style={{ backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-muted)'}}>
            <p>
                Tipp: Damit wir dich bei Rückfragen (z.B. zu Terminen) besser erreichen können,
                <Link href="/einstellungen" className="font-bold underline text-gold-500 hover:text-gold-400 mx-1">
                füge deinen Instagram-Namen hinzu
                </Link>.
            </p>

            <button onClick={handleDismiss}
            className="absolute top-1/2 right-4 -translate-y-1/2 p-2 hover:opacity-70"
            aria-label="Banner schließen">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}