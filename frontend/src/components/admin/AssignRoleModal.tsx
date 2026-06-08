'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { adminApi } from '../../lib/api/admin';

interface Role { id: string; code: string; name: string; }
interface UserRole { id: string; code: string; name: string; }

interface Department {
  id: string;
  name: string;
  code: string;
  manager_user_id: string | null;
}

interface Props {
  userId: string;
  userName: string;
  currentRoles: UserRole[];
  onClose: () => void;
  onUpdated: () => void;
}

export function AssignRoleModal({ userId, userName, currentRoles, onClose, onUpdated }: Props) {
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  useEffect(() => {
    adminApi.getRoles().then(setAllRoles);
    adminApi.getDepartments().then(setDepartments);
  }, []);

  const currentRoleCodes = currentRoles.map((r) => r.code);

  const handleToggle = async (role: Role) => {
    setError(null);
    const hasRole = currentRoleCodes.includes(role.code);

    // Prevent removing the last role
    if (hasRole && currentRoles.length === 1) {
      setError('User must have at least one role.');
      return;
    }

    // Special flow for assigning manager: pick department first
    if (!hasRole && role.code === 'manager') {
      setShowDeptPicker(true);
      setSelectedDeptId('');
      return;
    }

    // Normal assign/remove for non-manager roles or manager removal
    setLoading(role.id);
    try {
      if (hasRole) {
        await adminApi.removeRole(userId, role.id);
      } else {
        await adminApi.assignRole(userId, role.id);
      }
      onUpdated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to update role.';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const confirmManagerAssignment = async () => {
    if (!selectedDeptId) {
      setError('Please select a department for this manager.');
      return;
    }

    setError(null);
    setLoading('manager');

    try {
      const dept = departments.find((d) => d.id === selectedDeptId) || null;

      // If there is an existing manager, confirm replacement
      if (dept?.manager_user_id && dept.manager_user_id !== userId) {
        const ok = window.confirm(
          `This department already has a manager.\n\n` +
          `Do you want to replace the current manager for ${dept.code} - ${dept.name}?`,
        );
        if (!ok) {
          setLoading(null);
          return;
        }
      }

      await adminApi.setDepartmentManager(userId, selectedDeptId);
      onUpdated();
      setShowDeptPicker(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to assign manager role.';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Manage Roles</h2>
            <p className="text-xs text-gray-500 mt-0.5">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-2">
          {!showDeptPicker && (
            <>
              {allRoles.map((role) => {
                const hasRole = currentRoleCodes.includes(role.code);
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{role.name}</p>
                      <p className="text-xs text-gray-400">{role.code}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(role)}
                      disabled={loading === role.id}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        hasRole
                          ? 'bg-teal-100 text-teal-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-teal-100 hover:text-teal-700'
                      }`}
                    >
                      {loading === role.id ? '...' : hasRole ? 'Remove' : 'Assign'}
                    </button>
                  </div>
                );
              })}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md mt-2">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="pt-2">
                <Button variant="secondary" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </>
          )}

          {showDeptPicker && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">
                Assign manager to a department
              </p>
              <p className="text-xs text-gray-500">
                Select which department this user will manage. If a manager already exists, you&apos;ll replace them.
              </p>

              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                    {d.manager_user_id ? ' (has manager)' : ''}
                  </option>
                ))}
              </select>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  loading={loading === 'manager'}
                  onClick={confirmManagerAssignment}
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setShowDeptPicker(false); setSelectedDeptId(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}