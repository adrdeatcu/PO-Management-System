'use client';

import { useEffect, useState, useCallback } from 'react';
import { TopBar } from '../../../../components/layout/TopBar';
import { Button } from '../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { CreateUserModal } from '../../../../components/admin/CreateUserModal';
import { AssignRoleModal } from '../../../../components/admin/AssignRoleModal';
import { adminApi } from '../../../../lib/api/admin';
import { formatDateShort } from '../../../../lib/utils/format';
import { Plus, Search } from 'lucide-react';

interface UserRole { id: string; code: string; name: string; }

interface User {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
  created_at: string;
  departments: { id: string; name: string; code: string } | null;
  roles: UserRole[];
}

interface Department {
  id: string;
  name: string;
  code: string;
  manager_user_id: string | null;
}

const roleColors: Record<string, string> = {
  admin:    'bg-purple-100 text-purple-700',
  manager:  'bg-blue-100 text-blue-700',
  finance:  'bg-green-100 text-green-700',
  it:       'bg-orange-100 text-orange-700',
  employee: 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await adminApi.getUsers(search || undefined);
    setUsers(data as User[]);
    setLoading(false);
  }, [search]);

  const fetchDepartments = useCallback(async () => {
    const depts = await adminApi.getDepartments();
    setDepartments(depts as Department[]);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDepartmentChange = async (user: User, newDepartmentId: string) => {
    setError(null);

    const oldDept = user.department_id
      ? departments.find((d) => d.id === user.department_id) ?? null
      : null;
    const newDept = newDepartmentId
      ? departments.find((d) => d.id === newDepartmentId) ?? null
      : null;

    const oldLabel = oldDept ? `${oldDept.code} — ${oldDept.name}` : 'No department';
    const newLabel = newDept ? `${newDept.code} — ${newDept.name}` : 'No department';

    const confirmed = window.confirm(
      `Are you sure you want to move "${user.full_name}"\n` +
      `from: ${oldLabel}\n` +
      `to:   ${newLabel}?\n\n` +
      (newDept
        ? 'If this user is a manager in another department, that relationship may no longer be valid.'
        : 'If this user is currently a manager, their manager assignments and manager role will be revoked.'),
    );

    if (!confirmed) {
      // Let React re-render with previous value on next fetch; no optimistic update here.
      return;
    }

    setUpdatingUserId(user.id);

    try {
      await adminApi.updateUserDepartment(user.id, newDepartmentId || null);
      await fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update department.';
      setError(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <>
      <TopBar
        title="User Management"
        actions={
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New User
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Department', 'Roles', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <select
                        value={user.department_id ?? ''}
                        onChange={(e) => handleDepartmentChange(user, e.target.value)}
                        disabled={updatingUserId === user.id}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white min-w-40"
                      >
                        <option value="">No department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} — {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role.id ?? role.code}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              roleColors[role.code] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {role.code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDateShort(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-sm text-teal-700 hover:underline font-medium"
                      >
                        Manage Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No users found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {selectedUser && (
        <AssignRoleModal
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          currentRoles={selectedUser.roles}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => {
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}
    </>
  );
}