import apiClient from './client';
import type { PurchaseOrder, POWithActions } from '../../types/purchase-order';

export interface CreatePOPayload {
  title: string;
  description?: string;
  amount: number;
  category: string;
}

export interface QueryPOParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const purchaseOrdersApi = {
  getMyPOs: async (params?: QueryPOParams): Promise<PurchaseOrder[]> => {
    const { data } = await apiClient.get('/purchase-orders', { params });
    return data as PurchaseOrder[];
  },

  getOne: async (id: string): Promise<POWithActions> => {
    const { data } = await apiClient.get(`/purchase-orders/${id}`);
    return data as POWithActions;
  },

  create: async (payload: CreatePOPayload): Promise<PurchaseOrder> => {
    const { data } = await apiClient.post('/purchase-orders', payload);
    return data as PurchaseOrder;
  },

  update: async (id: string, payload: Partial<CreatePOPayload>): Promise<PurchaseOrder> => {
    const { data } = await apiClient.patch(`/purchase-orders/${id}`, payload);
    return data as PurchaseOrder;
  },
};
