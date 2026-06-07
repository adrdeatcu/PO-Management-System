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
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [depts, usrs] = await Promise.all([
      adminApi.getDepartments(),
      adminApi.getUsers(),
    ]);
    setDepartments(depts);
    setUsers(usrs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleManagerChange = async (deptId: string, managerId: string) => {
    setUpdatingId(deptId);
    await adminApi.updateDepartment(deptId, {
      manager_user_id: managerId || null,
    });
    await fetchAll();
    setUpdatingId(null);
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

      <div className="p-6">
        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Name', 'Manager', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">{dept.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={dept.manager_user_id ?? ''}
                        onChange={(e) => handleManagerChange(dept.id, e.target.value)}
                        disabled={updatingId === dept.id}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white min-w-48"
                      >
                        <option value="">No manager assigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {updatingId === dept.id && 'Saving...'}
                    </td>
                  </tr>
                ))}
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