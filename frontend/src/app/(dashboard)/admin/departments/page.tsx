'use client';

import { useEffect, useState, useCallback } from 'react';
import { TopBar } from '../../../../components/layout/TopBar';
import { Button } from '../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { CreateDepartmentModal } from '../../../../components/admin/CreateDepartmentModal';
import { adminApi } from '../../../../lib/api/admin';
import { Plus } from 'lucide-react';

interface Department {
  id: string;
  code: string;
  name: string;
  manager_user_id: string | null;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [depts, usrs] = await Promise.all([
      adminApi.getDepartments(),
      adminApi.getUsers(),
    ]);
    setDepartments(depts as Department[]);
    setUsers(usrs as User[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleManagerChange = async (dept: Department, managerId: string) => {
    setError(null);

    // If cleared (no manager), just clear manager_user_id locally for now and refresh from backend
    if (!managerId) {
      // Optionally, you could add a backend endpoint later to clear manager_user_id.
      setUpdatingId(dept.id);
      try {
        // For now, just refresh data; departments will still show "No manager assigned"
        await fetchAll();
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    const selectedUser = users.find((u) => u.id === managerId) || null;
    if (!selectedUser) {
      setError('Selected user not found.');
      return;
    }

    // Enforce: user must belong to this department
    if (selectedUser.department_id !== dept.id) {
      setError('User must belong to the department in order to become its manager.');
      return;
    }

    // If there is already a different manager, confirm replacement
    if (dept.manager_user_id && dept.manager_user_id !== managerId) {
      const ok = window.confirm(
        `This department already has a manager.\n\n` +
        `Do you want to replace the current manager for ${dept.code} - ${dept.name}?`,
      );
      if (!ok) return;
    }

    setUpdatingId(dept.id);
    try {
      await adminApi.setDepartmentManager(managerId, dept.id);
      await fetchAll();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to update manager.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <TopBar
        title="Department Management"
        actions={
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Department
          </Button>
        }
      />

      <div className="p-6 space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
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
                  {['Code', 'Name', 'Manager', ''].map((h) => (
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
                {departments.map((dept) => {
                  const deptUsers = users.filter((u) => u.department_id === dept.id);

                  return (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {dept.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={dept.manager_user_id ?? ''}
                          onChange={(e) => handleManagerChange(dept, e.target.value)}
                          disabled={updatingId === dept.id}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white min-w-48"
                        >
                          <option value="">No manager assigned</option>
                          {deptUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {updatingId === dept.id && 'Saving...'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {departments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No departments yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDepartmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchAll(); }}
        />
      )}
    </>
  );
}