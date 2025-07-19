'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', instagram: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push('/verify-request'); 
    } else {
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
            {/* Formularfelder für name, email, instagram, password */}
            <input type="text" name="name" placeholder="Name" onChange={handleChange} required className="w-full p-2 bg-neutral-800 rounded"/>
            <input type="email" name="email" placeholder="E-Mail" onChange={handleChange} required className="w-full p-2 bg-neutral-800 rounded"/>
            <input type="text" name="instagram" placeholder="Instagram" onChange={handleChange} className="w-full p-2 bg-neutral-800 rounded"/>
            <input type="password" name="password" placeholder="Passwort" onChange={handleChange} required className="w-full p-2 bg-neutral-800 rounded"/>
            <button type="submit" className="w-full bg-gold-500 text-black font-bold p-2 rounded">Konto erstellen</button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
    </div>
  );
}