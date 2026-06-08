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

export interface DashboardStats {
  my_draft: number;
  my_needs_rework: number;
  my_pending_approval: number;
  my_completed_this_month: number;
  my_total: number;
  inbox_pending: number;
}

// Shape of the AI summary returned by the backend
export interface FeedbackSummary {
  summary: string;
  tips: string;
}

export const purchaseOrdersApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/purchase-orders/stats');
    return data as DashboardStats;
  },

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

  summarizeFeedback: async (id: string): Promise<FeedbackSummary> => {
    const { data } = await apiClient.post(`/purchase-orders/${id}/summarize-feedback`);
    return data as FeedbackSummary;
  },
};