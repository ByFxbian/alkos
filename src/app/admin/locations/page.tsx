/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingModal from '@/components/LoadingModal';
import { useSession } from 'next-auth/react';

// Enhanced Type Definition
type Location = {
  id: string;
  name: string;
  slug: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email?: string;
  description?: string;
  heroImage?: string;
};

export default function AdminLocationsPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', slug: '', address: '', city: '', postalCode: '', phone: '', email: '', description: '', heroImage: ''
  });

  // SECURITY: Authorization Check
  // ADMIN: Can Create, Edit, Delete ALL.
  // HEADOFBARBER: Can ONLY Edit their assigned location. Cannot Create/Delete.
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    // API logic should already return filtered locations for HeadOfBarber
    const res = await fetch('/api/admin/locations');
    if (!res.ok) return;
    const data = await res.json();
    setLocations(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // SECURITY: Prevent HeadOfBarber from Creating new locations if accidental exposure
    if (!isEditing && !isAdmin) {
        alert("Nur Administratoren können neue Standorte anlegen.");
        setIsLoading(false);
        return;
    }

    const url = isEditing 
        ? `/api/admin/locations/${isEditing}` 
        : '/api/admin/locations';
    
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (res.ok) {
        setFormData({ name: '', slug: '', address: '', city: '', postalCode: '', phone: '', email: '', description: '', heroImage: '' });
        setIsEditing(null);
        fetchLocations();
    } else {
        alert("Fehler beim Speichern. Berechtigung fehlt evtl.");
    }
    setIsLoading(false);
  };

  const handleEdit = (loc: any) => {
    setIsEditing(loc.id);
    setFormData({
        name: loc.name, slug: loc.slug, address: loc.address, city: loc.city,
        postalCode: loc.postalCode, phone: loc.phone || '', email: loc.email || '',
        description: loc.description || '', heroImage: loc.heroImage || ''
    });
  };

  const handleDelete = async (id: string) => {
    if(!isAdmin) return; // Strict Client Check
    if(!confirm("Location wirklich löschen? Das kann zu Fehlern führen, wenn noch Termine verknüpft sind!")) return;
    setIsLoading(true);
    await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
    fetchLocations();
  };

  // Prevent flicker
  if (!locations && isLoading) return <LoadingModal message="Lade Standorte..." />;

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700">
      {isLoading && <LoadingModal message="Speichere..." />}
      
      <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--color-text)]">Standorte verwalten</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
                {isAdmin ? 'Voller Zugriff auf alle Filialen.' : 'Details Ihrer zugewiesenen Filiale(n) bearbeiten.'}
          </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form - Only visible if Admin OR if actively editing */}
        {/* HeadOfBarber sees this only when they click "Edit" on their location list item, or is it better to always show?
            If HeadOfBarber has 1 location, we could auto-select it. 
            For now, standard UX: Select from list -> Edit form appears.
            EXCEPTION: Admins see always "Create New" form by default.
        */}
        {(isAdmin || isEditing) && (
            <div className="lg:col-span-1 bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] h-fit shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">
                    {isEditing ? 'Standort bearbeiten' : 'Neuen Standort anlegen'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Name</label>
                        <input required placeholder="z.B. Alkos Wien" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none" />
                    </div>
                    {/* Slug only editable by Admin usually, but let's allow it if careful. Maybe disable for Head? */}
                    <div>
                         <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Slug (URL)</label>
                        <input required disabled={!isAdmin && isEditing !== null} placeholder="z.B. wien" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase()})} 
                            className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] disabled:opacity-50" />
                         {!isAdmin && isEditing && <p className="text-xs text-[var(--color-text-muted)] mt-1">URL kann nur vom Admin geändert werden.</p>}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Adresse</label>
                        <input required placeholder="Straße 1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                            className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)]" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">PLZ</label>
                            <input required placeholder="1010" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} 
                                className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)]" />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Stadt</label>
                            <input required placeholder="Wien" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} 
                                className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)]" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Telefon</label>
                        <input placeholder="+43 ..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)]" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Hero Bild (URL)</label>
                        <input placeholder="https://..." value={formData.heroImage} onChange={e => setFormData({...formData, heroImage: e.target.value})} 
                            className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)]" />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                        <button type="submit" className="flex-1 bg-[var(--color-gold-500)] text-black font-bold py-2 rounded hover:brightness-110 transition-all">
                            {isEditing ? 'Speichern' : 'Erstellen'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={() => {
                                setIsEditing(null); 
                                setFormData({ name: '', slug: '', address: '', city: '', postalCode: '', phone: '', email: '', description: '', heroImage: '' })
                            }} className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text)] rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-3)]">
                                Abbrechen
                            </button>
                        )}
                    </div>
                </form>
            </div>
        )}

        <div className={`${(isAdmin || isEditing) ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
             {locations.length === 0 && !isLoading && (
                 <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)]">
                     Noch keine Standorte gefunden.
                 </div>
             )}

            {locations.map(loc => (
                <div key={loc.id} className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-[var(--color-gold-500)]/30 transition-colors">
                    <div className="flex items-start gap-4">
                        {/* Thumbnail if available */}
                        <div className="w-16 h-16 rounded-lg bg-[var(--color-surface)] flex-shrink-0 overflow-hidden border border-[var(--color-border)]">
                             {loc.heroImage ? (
                                 <img src={loc.heroImage} alt={loc.name} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-xs">No Img</div>
                             )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[var(--color-text)] flex items-center gap-2">
                                {loc.name} 
                                {isAdmin && <span className="px-2 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-text-muted)] text-xs font-normal font-mono">{loc.slug}</span>}
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)]">{loc.address}, {loc.postalCode} {loc.city}</p>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">{loc.phone}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleEdit(loc)} className="px-4 py-2 rounded bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface-3)] transition-colors">
                            Bearbeiten
                        </button>
                        {isAdmin && (
                            <button onClick={() => handleDelete(loc.id)} className="px-4 py-2 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors">
                                Löschen
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}