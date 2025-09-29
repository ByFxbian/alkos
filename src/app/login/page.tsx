'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaApple, FaGoogle } from 'react-icons/fa';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await signIn('credentials', {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);

    if (result?.ok) {
      router.push('/'); 
      router.refresh();
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

        <div className="space-y-2">
          <button 
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold p-2 rounded hover:bg-neutral-200 transition-colors"
          >
            <FaGoogle /> Mit Google anmelden
          </button>
          <button 
            onClick={() => signIn('apple', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 font-bold p-2 rounded border e hover:opacity-80 transition-colors"
            style={{ 
              backgroundColor: 'var(--color-text)', 
              color: 'var(--color-background)',
              borderColor: 'var(--color-text)'
            }}
          >
            <FaApple /> Mit Apple anmelden
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex grow border-t " style={{ borderColor: 'var(--color-border)' }}></div>
          <span className="flex-shrink mx-4 " style={{ color: 'var(--color-text-muted)' }}>ODER</span>
          <div className="flex-grow border-t " style={{ borderColor: 'var(--color-border)' }}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" name="email" placeholder="E-Mail" onChange={handleChange} required className="w-full p-2  rounded" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}/>
            <input type="password" name="password" placeholder="Passwort" onChange={handleChange} required className="w-full p-2 rounded" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}/>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gold-500 text-black font-bold p-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Logge ein...' : 'Einloggen'}
            </button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
        <p className="mt-4 text-center">
            Noch kein Konto? <Link href="/register" className="text-gold-500 hover:underline">Jetzt registrieren</Link>
        </p>
    </div>
  );
}