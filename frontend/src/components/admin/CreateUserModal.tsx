'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { adminApi } from '../../lib/api/admin';

interface Department { id: string; name: string; code: string; }
interface Role { id: string; code: string; name: string; }

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ASSIGNABLE_ROLES = ['manager', 'it', 'finance', 'admin'];

export function CreateUserModal({ onClose, onCreated }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState({
    email: '', password: '', full_name: '',
    department_id: '', role_codes: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.getDepartments(), adminApi.getRoles()]).then(
      ([depts, rls]) => {
        setDepartments(depts);
        setRoles(rls.filter((r: Role) => ASSIGNABLE_ROLES.includes(r.code)));
      },
    );
  }, []);

  const toggleRole = (code: string) => {
    setForm((f) => ({
      ...f,
      role_codes: f.role_codes.includes(code)
        ? f.role_codes.filter((r) => r !== code)
        : [...f.role_codes, code],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.createUser({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        department_id: form.department_id || undefined,
        role_codes: form.role_codes,
      });
      onCreated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create user.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Create User Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text" required value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="jane@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <input
              type="password" required minLength={8} value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="">No department assigned</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Roles
              <span className="ml-1 text-xs text-gray-400">(employee is always assigned)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.code}
                  type="button"
                  onClick={() => toggleRole(role.code)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.role_codes.includes(role.code)
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-teal-600'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">Create User</Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}