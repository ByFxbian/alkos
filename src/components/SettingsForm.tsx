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
  image: string;
  bio: string;
  emailVerified: Date | null;
};

interface SettingsFormProps {
  user: UserData;
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    instagram: user.instagram,
    image: user.image,
    bio: user.bio,
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

  const [showInstagramBanner, setShowInstagramBanner] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        bio: formData.bio,
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

  useEffect(() => {
    if(user && !user.instagram) {
      setShowInstagramBanner(true);
    }
  }, [user]);

  return (
    <>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-8 rounded-lg space-y-6" style={{ backgroundColor: 'var(--color-surface)'}}>
            {showInstagramBanner && (
              <div className="bg-blue-900/50 border border-blue-700 text-blue-300 p-4 rounded-lg text-center">
                <p className="font-bold mb-2">Vervollständige dein Profil</p>
                <p className="text-sm">Bitte trage deinen Instagram-Namen ein, um Termine buchen zu können.</p>
              </div>
            )}
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
                    src={user.image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
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
                        className="px-4 py-2 rounded-md text-sm font-semibold"
                        style={{ backgroundColor: 'var(--color-surface-3)'}}
                        onClick={() => inputFileRef.current?.click()}
                    >
                        Bild ändern
                    </button>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>PNG, JPG (max. 4MB)</p>
                </div>
            </div>


            <div>
                <label htmlFor="email" className="block text-sm font-medium " style={{ color: 'var(--color-text-muted)' }}>E-Mail</label>
                <input type="email" id="email" value={user.email} disabled className="mt-1 w-full p-2 rounded border cursor-not-allowed" style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}/>
            </div>
            
            <div>
                <label htmlFor="name" className="block text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2 rounded border" style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}/>
            </div>

            <div>
                <label htmlFor="instagram" className="block text-sm font-medium " style={{ color: 'var(--color-text-muted)' }}>Instagram</label>
                <input type="text" id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} className="mt-1 w-full p-2 rounded border " style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}/>
            </div>

            <div>
                <label htmlFor="bio" className="block text-sm font-medium " style={{ color: 'var(--color-text-muted)' }}>Über mich (Bio)</label>
                <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 rounded border "
                    style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                    placeholder="Erzähle etwas über dich, deine Spezialitäten oder deine Philosophie."
                />
            </div>
            
            <div className="border-t pt-6" style={{ borderColor: 'var(--color-border)' }}>
                <p className="font-semibold mb-2">Passwort ändern</p>
                <p className="text-sm text-neutral-500 mb-4">Fülle die folgenden Felder nur aus, wenn du dein Passwort ändern möchtest.</p>
                <div className="space-y-4">
                    <input type="password" name="password" placeholder="Neues Passwort" value={formData.password} onChange={handleChange} className="w-full p-2 rounded border " style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}/>
                    <input type="password" name="confirmPassword" placeholder="Neues Passwort bestätigen" value={formData.confirmPassword} onChange={handleChange} className="w-full p-2 rounded border " style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}/>
                </div>
            </div>
        
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}

            <div className="text-right">
                <button type="submit" disabled={isLoading} className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50">
                    {isLoading ? 'Speichert...' : 'Änderungen speichern'}
                </button>
            </div>

            <div className="border-t border-red-800/50 pt-6 mt-6">
                <p className="font-semibold text-red-500">Gefahrenzone</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm " style={{ color: 'var(--color-text-muted)' }}>Konto dauerhaft löschen.</p>
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