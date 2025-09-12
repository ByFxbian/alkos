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
  
  // Dieser State steuert, was wir anzeigen: 'loading', 'scanner', oder 'redeeming'
  const [view, setView] = useState<'loading' | 'scanner' | 'redeeming'>('loading');

  const redeemToken = async (tokenValue: string) => {
    if (message || error) return; // Verhindert doppeltes Ausführen
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

  // Dieser useEffect läuft GARANTIERT nur auf dem Client, NACHDEM die Seite geladen ist
  useEffect(() => {
    // Wenn der User eingeloggt ist, entscheiden wir, was zu tun ist
    if (status === 'authenticated') {
      // Wir holen den Token direkt aus der Browser-URL, ohne den problematischen Hook
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (tokenFromUrl) {
        setView('redeeming');
        redeemToken(tokenFromUrl);
      } else {
        setView('scanner'); // Kein Token gefunden -> Scanner anzeigen
      }
    }
    // Wenn der User nicht eingeloggt ist, leiten wir ihn zum Login
    else if (status === 'unauthenticated') {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      const callbackUrl = `/redeem-stamp${tokenFromUrl ? `?token=${tokenFromUrl}` : ''}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status]); // Dieser Effekt wird ausgeführt, sobald der Login-Status bekannt ist

  // === Render-Logik basierend auf dem 'view'-State ===

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
        <p className="text-neutral-400 mb-6">Halte deine Kamera vor den QR-Code, den du von deinem Barber erhalten hast.</p>
        <div className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-neutral-700">
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
                  // Ignorieren, wenn es kein gültiger Link ist
                }
              }
            }}
            onError={(error) => console.error(error)}
          />
        </div>
      </div>
    );
  }

  // Fallback, falls etwas Unerwartetes passiert
  return <p className="text-center mt-20">Ein Fehler ist aufgetreten.</p>;
}