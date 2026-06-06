import apiClient from './client';
import type { PurchaseOrder } from '../../types/purchase-order';
import type { ApprovePayload, RejectPayload, CompletePayload } from '../../types/workflow';

export const workflowApi = {
  getInbox: async (): Promise<PurchaseOrder[]> => {
    const { data } = await apiClient.get('/workflow/inbox');
    return data as PurchaseOrder[];
  },

  submit: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/workflow/${id}/submit`);
    return data as { message: string };
  },

  approveManager: async (id: string, payload: ApprovePayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/workflow/${id}/approve/manager`, payload);
    return data as { message: string };
  },

  approveIT: async (id: string, payload: ApprovePayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/workflow/${id}/approve/it`, payload);
    return data as { message: string };
  },

  approveFinance: async (id: string, payload: ApprovePayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/workflow/${id}/approve/finance`, payload);
    return data as { message: string };
  },

  reject: async (id: string, payload: RejectPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/workflow/${id}/reject`, payload);
    return data as { message: string };
  },

  complete: async (id: string, payload: CompletePayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/workflow/${id}/complete`, payload);
    return data as { message: string };
  },
};
