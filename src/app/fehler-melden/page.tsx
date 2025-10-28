'use client';

import { useState } from "react";
import LoadingModal from "@/components/LoadingModal";

export default function FehlerMeldenPage() {
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!description.trim()){
            setError('Bitte beschreibe den Fehler.');
            return;
        }
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/report-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({description, email}),
            });

            if(res.ok) {
                setMessage('Vielen Danke! Deine Fehlermeldung wurde erfolgreich gesendet.');
                setDescription('');
                setEmail('');
            } else {
                const data = await res.json();
                setError(data.error || 'Fehler beim Senden der Meldung.');
            }
        } catch (err) {
            console.error('Error reporting:', err);
            setError('Ein Netzwerkfehler is aufgetreten.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && <LoadingModal message="Meldung wird gesendet..." />}
            <div className="container mx-auto py-12 px-4 max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Fehler melden</h1>
                <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
                Ist dir ein Fehler auf der Webseite aufgefallen? Bitte beschreibe ihn kurz, damit wir ihn beheben können. Vielen Dank für deine Hilfe!
                </p>

                {message && (
                <div className="bg-green-800 border border-green-600 text-white p-4 rounded-lg mb-6 text-center">
                    {message}
                </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Beschreibung des Fehlers <span className="text-red-500">*</span>
                    </label>
                    <textarea
                    id="description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Was ist passiert? Auf welcher Seite warst du? Was hast du erwartet?"
                    className="w-full p-2 rounded border"
                    style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Deine E-Mail (Optional)
                    </label>
                    <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Falls wir Rückfragen haben"
                    className="w-full p-2 rounded border"
                    style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Wird nur verwendet, falls wir zur Behebung des Fehlers nachfragen müssen.
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="text-right">
                    <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-colors"
                    >
                    {isLoading ? 'Sendet...' : 'Fehler melden'}
                    </button>
                </div>
                </form>
            </div>
        </>
    )
}