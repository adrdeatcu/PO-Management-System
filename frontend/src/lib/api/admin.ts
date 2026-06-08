import apiClient from './client';

export interface AdminRole {
  id: string;
  code: string;
  name: string;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
  created_at: string;
  departments: { id: string; name: string; code: string } | null;
  roles: AdminRole[];
}

export interface AdminDepartment {
  id: string;
  name: string;
  code: string;
  manager_user_id: string | null;
}

export const adminApi = {
  // Users
  getUsers: async (search?: string) => {
    const { data } = await apiClient.get('/admin/users', {
      params: search ? { search } : undefined,
    });
    return data as AdminUser[];
  },

  createUser: async (payload: {
    full_name: string;
    email: string;
    password: string;
    department_id?: string | null;
    role_codes?: string[];
  }) => {
    const { data } = await apiClient.post('/admin/users', payload);
    return data as { id: string; message: string };
  },

  updateUserDepartment: async (userId: string, department_id: string | null) => {
    const { data } = await apiClient.patch(`/admin/users/${userId}/department`, { department_id });
    return data as { message: string };
  },

  // Roles
  getRoles: async () => {
    const { data } = await apiClient.get('/admin/roles');
    return data as AdminRole[];
  },

  assignRole: async (userId: string, roleId: string) => {
    const { data } = await apiClient.post(`/admin/users/${userId}/roles`, {
      role_id: roleId,
    });
    return data as { message: string };
  },

  removeRole: async (userId: string, roleId: string) => {
    const { data } = await apiClient.delete(`/admin/users/${userId}/roles/${roleId}`);
    return data as { message: string };
  },

  // Departments
  getDepartments: async () => {
    const { data } = await apiClient.get('/admin/departments');
    return data as AdminDepartment[];
  },

  setDepartmentManager: async (userId: string, departmentId: string) => {
    const { data } = await apiClient.post('/admin/departments/set-manager', {
      user_id: userId,
      department_id: departmentId,
    });
    return data as { message: string; previous_manager_id: string | null };
  },

  // Purchase orders (admin overview)
  getAllPOs: async (params?: { status?: string; search?: string }) => {
    const { data } = await apiClient.get('/admin/purchase-orders', {
      params,
    });
    return data;
  },
};