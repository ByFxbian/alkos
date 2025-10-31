'use client';

import type { User, Role } from "@/generated/prisma";
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import CustomerDetailsModal from "./CustomerDetailsModal";

type UserManagementProps = {
  allUsers: User[];
  currentUserId: string;
};

type CustomerDataForModal = {
    name: string | null;
    email: string;
    image: string | null;
    instagram: string | null;
    completedAppointments: number;
}

export default function UserManagement({ allUsers, currentUserId }: UserManagementProps) {
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

  const handleDelete = async (userId: string) => {
    if (confirm('Bist du sicher, dass du diesen Benutzer endgültig löschen möchtest?')) {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      router.refresh();
    }
  };

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
          {/* Rollen aus prisma/schema.prisma */}
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
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleShowDetails(user)}
                      className="text-left hover:text-gold-500 transition-colors"
                    >
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={isRowDisabled}
                      className="text-sm rounded-lg p-2"
                      style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="KUNDE">Kunde</option>
                      <option value="BARBER">Barber</option>
                      <option value="HEADOFBARBER">Head Of Barber</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={isRowDisabled}
                      className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Löschen
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
            <div key={user.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
              
              <div className="mb-4">
                <button 
                  onClick={() => handleShowDetails(user)}
                  className="text-left hover:text-gold-500 transition-colors"
                >
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</div>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Rolle</label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  disabled={isRowDisabled}
                  className="w-full text-sm rounded-lg p-2"
                  style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}
                >
                  <option value="KUNDE">Kunde</option>
                  <option value="BARBER">Barber</option>
                  <option value="HEADOFBARBER">Head Of Barber</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Aktionen</label>
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={isRowDisabled}
                  className="w-full text-left text-red-500 hover:text-red-400 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-surface-3)'}}
                >
                  Löschen
                </button>
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