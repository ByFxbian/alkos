'use client';

import { useState } from "react";
import Link from "next/link";
import LoadingModal from "@/components/LoadingModal";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setMessage('E-Mail wurde gesendet. Bitte überprüfe dein Postfach (und Spam-Ordner).');
            } else {
                const data = await res.json();
                setError(data.error || 'Ein Fehler ist aufgetreten.');
            }
        } catch (err) {
            setError('Ein Netzwerkfehler ist aufgetreten.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && <LoadingModal message="Sende E-Mail..." />}
            <div className="container mx-auto py-12 px-4 max-w-md">
                <h1 className="text-4xl font-bold mb-4">Passwort vergessen</h1>
                {!message ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                            Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, um dein Passwort zurückzusetzen.
                        </p>
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="E-Mail" 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full p-2 rounded" 
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-gold-500 text-black font-bold p-2 rounded disabled:opacity-50"
                        >
                            {isLoading ? 'Sendet...' : 'Link anfordern'}
                        </button>
                        {error && <p className="text-red-500">{error}</p>}
                    </form>
                ) : (
                    <div className="bg-green-800 border border-green-600 text-white p-4 rounded-lg text-center">
                        <p className="font-bold">E-Mail unterwegs!</p>
                        <p>{message}</p>
                    </div>
                )}

                <p className="mt-4 text-center">
                    <Link href="/login" className="text-gold-500 hover:underline">Zurück zum Login</Link>
                </p>
            </div>
        </>
    )
}