'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', instagram: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      setIsLoading(false);
      if (loginResult?.ok) {
        router.push('/auth/verify');
      } else {
        router.push('/login');
      }
    } else {
      setIsLoading(false);
      const data = await res.json();
      setError(data.error || 'Ein Fehler ist aufgetreten.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
        <h1 className="text-4xl font-bold mb-4">Registrieren</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Name" onChange={handleChange} required className="w-full p-2 rounded" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}/>
            <input type="email" name="email" placeholder="E-Mail" onChange={handleChange} required className="w-full p-2 rounded" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}/>
            <input type="text" name="instagram" placeholder="Instagram" onChange={handleChange} className="w-full p-2 rounded" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}/>
            <input type="password" name="password" placeholder="Passwort" onChange={handleChange} required className="w-full p-2 rounded" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}/>
            <button type="submit" disabled={isLoading} className="w-full bg-gold-500 text-black font-bold p-2 rounded disabled:opacity-50">
              {isLoading ? 'Erstelle Konto...' : 'Konto erstellen'}
            </button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
        <p className="mt-4 text-center">
            Du hast bereits ein Konto? <Link href="/login" className="text-gold-500 hover:underline">Jetzt anmelden</Link>
        </p>
    </div>
  );
}