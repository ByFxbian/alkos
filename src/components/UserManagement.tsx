'use client';

import type { User, Role } from "@/generated/prisma";
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import CustomerDetailsModal from "./CustomerDetailsModal";
import Image from "next/image";

type UserWithDetails = User & { 
    isBlocked: boolean;
    locations: { id: string; name: string }[];
};

type UserManagementProps = {
  allUsers: UserWithDetails[];
  currentUserId: string;
  availableLocations: Location[];
  currentUserRole: string;
};

type CustomerDataForModal = {
  name: string | null;
  email: string;
  image: string | null;
  instagram: string | null;
  completedAppointments: number;
}

type Location = { id: string; name: string; slug?: string; };

const PLACEHOLDER_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

export default function UserManagement({ allUsers, currentUserId, availableLocations, currentUserRole }: UserManagementProps) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDataForModal | null>(null);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesRole = filterRole === 'ALL' || user.role === filterRole;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (user.name?.toLowerCase() || '').includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      return matchesRole && matchesSearch;
    });
  }, [allUsers, searchTerm, filterRole]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    router.refresh();
  };

  const handleLocationToggle = async (user: UserWithDetails, locationId: string) => {
    const isAssigned = user.locations.some(l => l.id === locationId);
    let newLocationIds: string[] = [];

    if (isAssigned) {
        newLocationIds = user.locations.filter(l => l.id !== locationId).map(l => l.id);
    } else {
        newLocationIds = [...user.locations.map(l => l.id), locationId];
    }

    await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds: newLocationIds })
    });
    router.refresh();
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Bist du sicher, dass du diesen Benutzer endgültig löschen möchtest?')) {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      router.refresh();
    }
  };

  const handleBlock = async (userId: string, currentStatus: boolean) => {
    await fetch(`/api/admin/users/${userId}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !currentStatus }),
    });
    router.refresh();
  }

  const handleBan = async (userId: string) => {
    if (confirm('ACHTUNG: Benutzer löschen UND E-Mail permanent sperren?')) {
      await fetch(`/api/admin/users/${userId}/delete-blacklist`, { method: 'DELETE' });
      router.refresh();
    }
  }

  const handleShowDetails = (user: User) => {
    setSelectedCustomer({
      name: user.name,
      email: user.email,
      image: user.image,
      instagram: user.instagram,
      completedAppointments: user.completedAppointments,
    });
  };

  return (
    <div>
      <CustomerDetailsModal 
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Name oder E-Mail suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded border"
          style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | 'ALL')}
          className="w-full md:w-auto p-2 rounded border"
          style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
        >
          <option value="ALL">Alle Rollen</option>
          <option value="KUNDE">Kunde</option>
          <option value="BARBER">Barber</option>
          <option value="HEADOFBARBER">Head Of Barber</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="hidden md:block rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border)' }}>
          <thead style={{ backgroundColor: 'var(--color-surface-3)'}}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rolle</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y " style={{ borderColor: 'var(--color-border)' }}>
            {filteredUsers.map((user) => {
              const isRowDisabled =
                user.id === currentUserId ||
                user.role === 'ADMIN';

              return (
                <tr key={user.id} className={user.isBlocked ? "bg-red-50 dark:bg-red-900/10" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleShowDetails(user)}
                      className="text-left hover:text-gold-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                            src={user.image || PLACEHOLDER_IMAGE}
                            alt={user.name || 'Profilbild'}
                            width={40}
                            height={40}
                            className="rounded-full object-cover w-10 h-10"
                        />
                        <div> 
                            <div className="text-sm font-medium">
                            {user.name}
                            {user.isBlocked && <span className="ml-2 text-xs text-red-500 font-bold">(BLOCKIERT)</span>}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={isRowDisabled}
                      className="text-sm rounded-lg p-2 mr-2"
                      style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="KUNDE">Kunde</option>
                      <option value="BARBER">Barber</option>
                      <option value="HEADOFBARBER">Head Of Barber</option>
                      <option value="ADMIN">Admin</option>
                    </select>

                    {['BARBER', 'HEADOFBARBER'].includes(user.role) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {availableLocations.map(loc => {
                                const isAssigned = user.locations.some(l => l.id === loc.id);
                                return (
                                    <button
                                        key={loc.id}
                                        onClick={() => handleLocationToggle(user, loc.id)}
                                        disabled={isRowDisabled}
                                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                            isAssigned 
                                            ? 'bg-gold-500 text-black border-gold-500 font-bold' 
                                            : 'border-neutral-400 text-neutral-500 hover:border-gold-500'
                                        }`}
                                    >
                                        {loc.name}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleBlock(user.id, user.isBlocked)} disabled={isRowDisabled} 
                        className={`px-2 py-1 rounded ${user.isBlocked ? 'text-green-500 hover:bg-green-500/10' : 'text-orange-500 hover:bg-orange-500/10'}`}>
                        {user.isBlocked ? 'Entsperren' : 'Blockieren'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={isRowDisabled}
                      className="text-red-500 hover:bg-red-500/10 px-2 py-1 rounded"
                    >
                      Löschen
                    </button>
                    <button onClick={() => handleBan(user.id)} disabled={isRowDisabled} className="text-red-700 font-bold hover:bg-red-700/10 px-2 py-1 rounded" title="Löschen & Email sperren">
                      BANNEN
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => {
          const isRowDisabled = user.id === currentUserId || user.role === 'ADMIN';
          
          return (
            <div key={user.id} className={`p-4 rounded-lg border ${user.isBlocked ? 'border-red-500 bg-red-500/5' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`} style={{ backgroundColor: 'var(--color-surface)' }}>
              
              <div className="flex items-center gap-3 mb-4" onClick={() => handleShowDetails(user)}>
                <Image
                  src={user.image || PLACEHOLDER_IMAGE}
                  alt={user.name || 'Profilbild'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-10 h-10"
                />
                <div>
                  <div className="font-bold">{user.name} {user.isBlocked && <span className="text-red-500">(BLOCK)</span>}</div>
                  <div className="text-sm opacity-60">{user.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as Role)} disabled={isRowDisabled} className="p-2 rounded border bg-transparent">
                  <option value="KUNDE">Kunde</option>
                  <option value="BARBER">Barber</option>
                  <option value="HEADOFBARBER">Head</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button onClick={() => handleBlock(user.id, user.isBlocked)} disabled={isRowDisabled} className="border rounded p-2 text-center text-sm">
                  {user.isBlocked ? '🔓 Entsperren' : '🔒 Blockieren'}
                </button>
              </div>

              {['BARBER', 'HEADOFBARBER'].includes(user.role) && (
                  <div className="mb-4">
                      <label className="text-xs font-bold opacity-60 mb-1 block">Standorte</label>
                      <div className="flex flex-wrap gap-2">
                        {availableLocations.map(loc => {
                            const isAssigned = user.locations.some(l => l.id === loc.id);
                            return (
                                <button
                                    key={loc.id}
                                    onClick={() => handleLocationToggle(user, loc.id)}
                                    disabled={isRowDisabled}
                                    className={`text-xs px-3 py-2 rounded border ${isAssigned ? 'bg-gold-500 text-black border-gold-500 font-bold' : 'border-neutral-500'}`}
                                >
                                    {loc.name}
                                </button>
                            )
                        })}
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleDelete(user.id)} disabled={isRowDisabled} className="bg-red-100 dark:bg-red-900/20 text-red-500 p-2 rounded text-sm">Löschen</button>
                <button onClick={() => handleBan(user.id)} disabled={isRowDisabled} className="bg-red-500 text-white p-2 rounded text-sm font-bold">BANNEN (Löschen+Sperren)</button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
            <p className="text-center p-4" style={{ color: 'var(--color-text-muted)' }}>
                Keine Benutzer gefunden, die den Kriterien entsprechen.
            </p>
        )}
      </div>
    </div>
  );
}