import apiClient from './client';

export const adminApi = {
  getUsers: async (search?: string) => {
    const { data } = await apiClient.get('/admin/users', {
      params: search ? { search } : undefined,
    });
    return data;
  },

  createUser: async (payload: {
    email: string;
    password: string;
    full_name: string;
    department_id?: string;
    role_codes?: string[];
  }) => {
    const { data } = await apiClient.post('/admin/users', payload);
    return data;
  },

  updateUserDepartment: async (userId: string, departmentId: string | null) => {
    const { data } = await apiClient.patch(`/admin/users/${userId}/department`, {
      department_id: departmentId,
    });
    return data;
  },

  assignRole: async (userId: string, roleId: string) => {
    const { data } = await apiClient.post(`/admin/users/${userId}/roles`, { role_id: roleId });
    return data;
  },

  removeRole: async (userId: string, roleId: string) => {
    const { data } = await apiClient.delete(`/admin/users/${userId}/roles/${roleId}`);
    return data;
  },

  getAllPOs: async (params?: { status?: string; search?: string }) => {
    const { data } = await apiClient.get('/admin/purchase-orders', { params });
    return data;
  },

  getDepartments: async () => {
    const { data } = await apiClient.get('/departments');
    return data;
  },

  createDepartment: async (payload: { name: string; code: string }) => {
    const { data } = await apiClient.post('/admin/departments', payload);
    return data;
  },

  updateDepartment: async (id: string, payload: { name?: string; manager_user_id?: string | null }) => {
    const { data } = await apiClient.patch(`/admin/departments/${id}`, payload);
    return data;
  },

  getRoles: async () => {
    const { data } = await apiClient.get('/roles');
    return data;
  },
};