'use client';

import type { User, Role } from "@/generated/prisma";
import { useRouter } from 'next/navigation';

type UserManagementProps = {
  allUsers: User[];
  currentUserId: string;
};

export default function UserManagement({ allUsers, currentUserId }: UserManagementProps) {
  const router = useRouter();

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

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
      <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border)' }}>
        <thead style={{ backgroundColor: 'var(--color-surface-3)'}}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rolle</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y " style={{ borderColor: 'var(--color-border)' }}>
          {allUsers.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  disabled={user.id === currentUserId}
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
                  disabled={user.id === currentUserId}
                  className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}