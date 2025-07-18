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
    <div className="bg-neutral-900 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-800">
        <thead className="bg-neutral-950">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Rolle</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {allUsers.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="text-sm text-neutral-400">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  disabled={user.id === currentUserId}
                  className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg p-2"
                >
                  <option value="KUNDE">Kunde</option>
                  <option value="FRISEUR">Friseur</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={user.id === currentUserId}
                  className="text-red-500 hover:text-red-400 disabled:text-neutral-600 disabled:cursor-not-allowed"
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