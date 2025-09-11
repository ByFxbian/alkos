'use client';

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function RedeemStampPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { status } = useSession();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, [])

    const redeemToken = async (tokenValue: string) => {
        setMessage('Stempel wird eingelöst...');
        setError('');
        const res = await fetch('/api/stamps/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenValue }),
        });

        const data = await res.json();
        if (res.ok) {
            setMessage('Stempel erfolgreich erhalten! Du wirst weitergeleitet...');
            setTimeout(() => router.push('/meine-termine'), 2000);
        } else {
            setError(data.error || 'Ein unbekannter Fehler ist aufgetreten.');
            setMessage('');
        }
    };

    useEffect(() => {
        if(token && status === 'authenticated') {
            redeemToken(token);
        }
    }, [token, status]);

    if (status === 'loading') {
        return <p className="text-center mt-20">Lade...</p>
    }

    if(status === 'unauthenticated') {
        return <p className="text-center mt-20">Bitte logge dich ein, um einen Stempel einzulösen.</p>
    }

    if(!token) {
        return (
            <div className="container mx-auto py-12 px-4 max-w-md text-center">
                <h1 className="text-3xl font-bold mb-4">QR-Code scannen</h1>
                <p className="text-neutral-400 mb-6">Halte deine Kamera vor den QR-Code, den du von deinem Barber erhalten hast.</p>
                <div className="w-full max-w-sm mx-auto rounded-lg overflow-hidden">
                    <Scanner 
                        onScan={(detectedCodes) => {
                            if(detectedCodes && detectedCodes.length > 0) {
                                const resultText = detectedCodes[0].rawValue;
                                try {
                                    const url = new URL(resultText);
                                    const scannedToken = url.searchParams.get('token');
                                    if(scannedToken) {
                                        if(!message) redeemToken(scannedToken);
                                    } else {
                                        setError('Ungültiger QR-Code. Kein Token gefunden.');
                                    }
                                } catch {
                                    setError('Ungültiger QR-Code.');
                                }
                            }
                        }}
                        onError={(error) => console.error(error)}
                    />
                </div>
                {message && <p className="mt-4 text-green-400">{message}</p>}
                {error && <p className="mt-4 text-red-500">{error}</p>}
            </div> 
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-md text-center">
            {message && <p className="mt-4 text-green-400">{message}</p>}
            {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
    )

}