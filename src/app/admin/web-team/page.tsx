/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import LoadingModal from '@/components/LoadingModal';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image: string | null;
  sortOrder: number;
  locations: { id: string, name: string }[];
};

type Location = { id: string; name: string; };

export default function AdminWebTeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', role: '', bio: '', image: '', sortOrder: 0, locationIds: [] as string[]
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    Promise.all([
        fetch('/api/admin/team').then(r => r.json()),
        fetch('/api/admin/locations').then(r => r.json())
    ]).then(([teamData, locData]) => {
        setMembers(teamData);
        setLocations(locData);
        setIsLoading(false);
    });
  }, []);

  const refresh = async () => {
    const res = await fetch('/api/admin/team');
    setMembers(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = isEditing ? `/api/admin/team/${isEditing}` : '/api/admin/team';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    setFormData({ name: '', role: '', bio: '', image: '', sortOrder: 0, locationIds: [] });
    setIsEditing(null);
    await refresh();
    setIsLoading(false);
  };

  const handleEdit = (m: TeamMember) => {
    setIsEditing(m.id);
    setFormData({
        name: m.name,
        role: m.role,
        bio: m.bio || '',
        image: m.image || '',
        sortOrder: m.sortOrder,
        locationIds: m.locations.map(l => l.id)
    });
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Mitglied löschen?")) return;
    setIsLoading(true);
    await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    await refresh();
    setIsLoading(false);
  };

  const toggleLocation = (locId: string) => {
    setFormData(prev => {
        const exists = prev.locationIds.includes(locId);
        if (exists) return { ...prev, locationIds: prev.locationIds.filter(id => id !== locId) };
        return { ...prev, locationIds: [...prev.locationIds, locId] };
    });
  };

  if (isLoading && !members.length) return <LoadingModal message="Lade Team..." />;

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700">
      {isLoading && members.length > 0 && <LoadingModal message="Speichere..." />}
      
      <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--color-text)]">Web-Team Showcase</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            {isAdmin 
                ? 'Verwalten Sie die Team-Anzeige auf der Website für alle Standorte.' 
                : 'Bearbeiten Sie die Team-Anzeige für Ihren Standort.'}
          </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] h-fit shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">
                {isEditing ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                     <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Name</label>
                    <input required placeholder="Name (z.B. Adam)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]" />
                </div>
                <div>
                     <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Rolle</label>
                    <input required placeholder="z.B. Senior Barber" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} 
                        className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]" />
                </div>
                <div>
                     <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Bio</label>
                    <textarea placeholder="Kurze Beschreibung..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} 
                        className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] h-20 outline-none focus:border-[var(--color-gold-500)]" />
                </div>
                <div>
                     <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Bild URL</label>
                    <input placeholder="https://..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} 
                        className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]" />
                </div>
                <div>
                     <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Sortierung (0-99)</label>
                    <input type="number" placeholder="z.B. 1" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} 
                        className="w-full p-2 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]" />
                </div>
                
                <div className="mt-4">
                    <p className="text-sm font-bold mb-2 text-[var(--color-text)]">Anzeigen in Location:</p>
                    <div className="flex flex-wrap gap-2">
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                type="button"
                                onClick={() => toggleLocation(loc.id)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                    formData.locationIds.includes(loc.id) 
                                    ? 'bg-[var(--color-gold-500)] text-black border-[var(--color-gold-500)] font-bold' 
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)]'
                                }`}
                            >
                                {loc.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <button type="submit" className="flex-1 bg-[var(--color-gold-500)] text-black font-bold py-2 rounded hover:brightness-110 transition-all">
                        Speichern
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => {
                            setIsEditing(null); 
                            setFormData({ name: '', role: '', bio: '', image: '', sortOrder: 0, locationIds: [] })
                        }} className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text)] rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-3)]">
                            Abbrechen
                        </button>
                    )}
                </div>
            </form>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex gap-4 hover:border-[var(--color-gold-500)]/30 transition-colors group">
                    <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)]">
                        {m.image ? (
                            <Image src={m.image} alt={m.name} fill className="object-cover" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-xl font-bold">
                                {m.name.charAt(0)}
                             </div>
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-[var(--color-text)] truncate">{m.name}</h3>
                                <p className="text-xs text-[var(--color-gold-500)] uppercase font-medium tracking-wide">{m.role}</p>
                             </div>
                             <div className="flex gap-1">
                                <button onClick={() => handleEdit(m)} className="p-1.5 rounded-md hover:bg-[var(--color-surface-3)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                                <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-500 transition-colors" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                             </div>
                        </div>
                        
                        <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2">{m.bio}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                            {m.locations.map(l => (
                                <span key={l.id} className="text-[10px] bg-[var(--color-surface-3)] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                                    {l.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}