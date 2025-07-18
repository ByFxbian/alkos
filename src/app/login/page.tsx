'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await signIn('credentials', {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    if (result?.ok) {
      router.push('/termine');
    } else {
      setError('E-Mail oder Passwort ungültig.');
    }
  };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
        <h1 className="text-4xl font-bold mb-4">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" name="email" placeholder="E-Mail" onChange={handleChange} required className="w-full p-2 bg-neutral-800 rounded"/>
            <input type="password" name="password" placeholder="Passwort" onChange={handleChange} required className="w-full p-2 bg-neutral-800 rounded"/>
            <button type="submit" className="w-full bg-amber-400 text-black font-bold p-2 rounded">Einloggen</button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
        <p className="mt-4 text-center">
            Noch kein Konto? <Link href="/register" className="text-amber-400 hover:underline">Jetzt registrieren</Link>
        </p>
    </div>
  );
}