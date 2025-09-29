'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useSession } from 'next-auth/react';

export default function RedeemStampPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [view, setView] = useState<'loading' | 'scanner' | 'redeeming'>('loading');

  const redeemToken = async (tokenValue: string) => {
    if (message || error) return;
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
      const errorMessage = data.error || 'Ein unbekannter Fehler ist aufgetreten.';
      setError(data.error || 'Ein unbekannter Fehler ist aufgetreten.');
      setMessage('');
      alert(`Fehler: ${errorMessage}`);
    }
  };


  useEffect(() => {

    if (status === 'authenticated') {

      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (tokenFromUrl) {
        setView('redeeming');
        redeemToken(tokenFromUrl);
      } else {
        setView('scanner'); 
      }
    }

    else if (status === 'unauthenticated') {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      const callbackUrl = `/redeem-stamp${tokenFromUrl ? `?token=${tokenFromUrl}` : ''}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status]);

  if (view === 'loading' || status === 'loading') {
    return <p className="text-center mt-20">Lade...</p>;
  }

  if (view === 'redeeming') {
    return (
      <div className="container mx-auto py-12 px-4 max-w-md text-center">
        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    );
  }

  if (view === 'scanner' && status === 'authenticated') {
    return (
      <div className="container mx-auto py-12 px-4 max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">QR-Code scannen</h1>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>Halte deine Kamera vor den QR-Code, den du von deinem Barber erhalten hast.</p>
        <div className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 " style={{ borderColor: 'var(--color-border)' }}>
          <Scanner
            onScan={(detectedCodes) => {
              if (detectedCodes.length > 0) {
                const resultText = detectedCodes[0].rawValue;
                try {
                  const url = new URL(resultText);
                  const scannedToken = url.searchParams.get('token');
                  if (scannedToken) {
                    redeemToken(scannedToken);
                  }
                } catch {

                }
              }
            }}
            onError={(error) => console.error(error)}
          />
        </div>
      </div>
    );
  }

  return <p className="text-center mt-20">Ein Fehler ist aufgetreten.</p>;
}