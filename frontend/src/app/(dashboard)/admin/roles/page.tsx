'use client';

import { useEffect, useState, useCallback } from 'react';
import { TopBar } from '../../../../components/layout/TopBar';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { AssignRoleModal } from '../../../../components/admin/AssignRoleModal';
import { adminApi } from '../../../../lib/api/admin';

interface UserRole { id: string; code: string; name: string; }
interface User {
  id: string;
  full_name: string;
  email: string;
  departments: { name: string; code: string } | null;
  roles: UserRole[];
}

const roleColors: Record<string, string> = {
  admin:    'bg-purple-100 text-purple-700',
  manager:  'bg-blue-100 text-blue-700',
  finance:  'bg-green-100 text-green-700',
  it:       'bg-orange-100 text-orange-700',
  employee: 'bg-gray-100 text-gray-600',
};

export default function AdminRolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await adminApi.getUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <>
      <TopBar title="Role Assignments" />

      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Click a user to manage their role assignments. Changes take effect immediately.
        </p>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Department', 'Current Roles', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.departments?.name ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role.id ?? role.code}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role.code] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {role.code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-sm text-teal-700 hover:underline font-medium"
                      >
                        Edit Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <AssignRoleModal
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          currentRoles={selectedUser.roles}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => { setSelectedUser(null); fetchUsers(); }}
        />
      )}
    </>
  );
}