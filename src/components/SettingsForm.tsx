'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import DeleteAccountModal from './DeleteAccountModal';
import Image from 'next/image';

type UserData = {
  name: string;
  email: string;
  instagram: string;
  imageUrl: string;
  emailVerified: Date | null;
};

interface SettingsFormProps {
  user: UserData;
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    instagram: user.instagram,
    imageUrl: user.imageUrl,
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const inputFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    setCooldown(60);
    setMessage('Neue Verifizierungs-E-Mail wurde versendet.');
    await signIn('email', {
      email: user.email,
      redirect: false,
    });
  };

  const handleDeleteAccount = async (password: string) => {
    setIsLoading(true);
    setDeleteError('');
    const res = await fetch('/api/user/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      await signOut({ redirect: true, callbackUrl: '/' });
    } else {
      const data = await res.json();
      setDeleteError(data.error || 'Fehler beim Löschen des Kontos.');
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      setIsLoading(false);
      return;
    }

    const res = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        instagram: formData.instagram,
        //imageUrl: formData.imageUrl,
        password: formData.password || null, 
      }),
    });

    if (res.ok) {
      setMessage('Deine Einstellungen wurden erfolgreich gespeichert.');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Ein Fehler ist aufgetreten.');
    }
    setIsLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('Lade Bild hoch...');
    const response = await fetch(
      `/api/avatar/upload?filename=${file.name}`,
      { method: 'POST', body: file },
    );

    if (response.ok) {
        setMessage('Profilbild erfolgreich geändert!');
        router.refresh();
    } else {
        setError('Fehler beim Upload.');
    }
  };

  return (
    <>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-neutral-900 p-8 rounded-lg space-y-6">
            {!user.emailVerified && (
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-lg text-center">
                    <p className="font-bold mb-2">Dein Konto ist nicht verifiziert.</p>
                    <p className="text-sm mb-4">Bitte bestätige deine E-Mail-Adresse, um alle Funktionen nutzen zu können.</p>
                    <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={cooldown > 0}
                        className="bg-yellow-600 text-white font-bold px-4 py-2 rounded-md hover:bg-yellow-500 disabled:bg-neutral-600 disabled:cursor-not-allowed"
                    >
                        {cooldown > 0 ? `Erneut senden in ${cooldown}s` : 'Verifizierungs-E-Mail erneut senden'}
                    </button>
                </div>
            )}
            <div className="flex items-center space-x-4">
                <Image
                    src={user.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                    alt="Profilbild"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                />
                <div>
                    <input
                        type="file"
                        ref={inputFileRef}
                        onChange={handleAvatarUpload}
                        name="avatar"
                        className="hidden" 
                    />
                    <button
                        type="button"
                        className="bg-neutral-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-neutral-600"
                        onClick={() => inputFileRef.current?.click()}
                    >
                        Bild ändern
                    </button>
                    <p className="text-xs text-neutral-500 mt-1">PNG, JPG (max. 4MB)</p>
                </div>
            </div>


            <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-400">E-Mail</label>
                <input type="email" id="email" value={user.email} disabled className="mt-1 w-full p-2 bg-neutral-800 rounded border border-neutral-700 cursor-not-allowed"/>
            </div>
            
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-400">Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2 bg-neutral-800 rounded border border-neutral-700"/>
            </div>

            <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-neutral-400">Instagram</label>
                <input type="text" id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} className="mt-1 w-full p-2 bg-neutral-800 rounded border border-neutral-700"/>
            </div>
            
            <div className="border-t border-neutral-700 pt-6">
                <p className="font-semibold mb-2">Passwort ändern</p>
                <p className="text-sm text-neutral-500 mb-4">Fülle die folgenden Felder nur aus, wenn du dein Passwort ändern möchtest.</p>
                <div className="space-y-4">
                    <input type="password" name="password" placeholder="Neues Passwort" value={formData.password} onChange={handleChange} className="w-full p-2 bg-neutral-800 rounded border border-neutral-700"/>
                    <input type="password" name="confirmPassword" placeholder="Neues Passwort bestätigen" value={formData.confirmPassword} onChange={handleChange} className="w-full p-2 bg-neutral-800 rounded border border-neutral-700"/>
                </div>
            </div>
        
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}

            <div className="text-right">
                <button type="submit" disabled={isLoading} className="bg-amber-500 text-black font-bold px-6 py-2 rounded-md hover:bg-amber-400 disabled:bg-neutral-600">
                    {isLoading ? 'Speichert...' : 'Änderungen speichern'}
                </button>
            </div>

            <div className="border-t border-red-800/50 pt-6 mt-6">
                <p className="font-semibold text-red-500">Gefahrenzone</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-neutral-400">Konto dauerhaft löschen.</p>
                    <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-red-800 text-white font-bold px-4 py-2 rounded-md hover:bg-red-700"
                    >
                    Konto löschen...
                    </button>
                </div>
            </div>
        </form>

        <DeleteAccountModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteAccount}
            isLoading={isLoading}
            error={deleteError}
        />
    </>
  );
}