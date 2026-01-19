'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function EinstellungenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [originalPin, setOriginalPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
      router.push('/');
      return;
    }

    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.walkin_pin) {
          setPin(data.walkin_pin);
          setOriginalPin(data.walkin_pin);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [session, status, router]);

  const handleSave = async () => {
    if (pin.length < 4) {
      setMessage({ type: 'error', text: 'PIN muss mindestens 4 Zeichen haben' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'walkin_pin', value: pin }),
      });

      if (res.ok) {
        setOriginalPin(pin);
        setMessage({ type: 'success', text: 'PIN erfolgreich gespeichert' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Fehler beim Speichern' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Netzwerkfehler' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = pin !== originalPin;

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-48 mb-8" />
          <div className="h-32 bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Einstellungen</h1>

      <div className="max-w-xl">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="text-xl font-bold mb-4">Walk-In System</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Walk-In PIN
            </label>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Dieser PIN wird benötigt, um auf dem iPad die Walk-In Buchungsseite zu entsperren.
            </p>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Mindestens 4 Zeichen"
              className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-gold-500 focus:outline-none transition-all"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || pin.length < 4}
            className="w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-gold-500)', color: 'black' }}
          >
            {isSaving ? 'Speichern...' : 'PIN Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
