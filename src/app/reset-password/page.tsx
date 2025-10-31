'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingModal from '@/components/LoadingModal';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState<string | null>(null);
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError('Kein gültiger Token gefunden. Bitte fordere einen neuen Link an.');
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }
        if (!token) {
            setError('Der Link ist ungültig oder abgelaufen.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: formData.password }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage('Dein Passwort wurde erfolgreich geändert! Du wirst zum Login weitergeleitet...');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
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
            {isLoading && <LoadingModal message="Passwort wird geändert..." />}
            <div className="container mx-auto py-12 px-4 max-w-md">
                <h1 className="text-4xl font-bold mb-4">Neues Passwort festlegen</h1>
                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Neues Passwort" 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 rounded" 
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        />
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            placeholder="Passwort bestätigen" 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 rounded" 
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !token}
                            className="w-full bg-gold-500 text-black font-bold p-2 rounded disabled:opacity-50"
                        >
                            {isLoading ? 'Speichert...' : 'Neues Passwort speichern'}
                        </button>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                    </form>
                )}

                {message && (
                    <div className="bg-green-800 border border-green-600 text-white p-4 rounded-lg text-center">
                        <p>{message}</p>
                    </div>
                )}

                {(!token && !error) && (
                     <p className="text-center mt-20">Lade Token...</p>
                )}
            </div>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<p className="text-center mt-20">Lade...</p>}>
            <ResetPasswordForm />
        </Suspense>
    );
}