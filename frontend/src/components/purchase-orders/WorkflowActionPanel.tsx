'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { workflowApi } from '../../lib/api/workflow';
import {
  canSubmitPO, canApproveAsManager, canApproveAsIT,
  canApproveAsFinance, canReject, canComplete,
} from '../../lib/utils/permissions';
import type { PurchaseOrder } from '../../types/purchase-order';
import type { AuthUser } from '../../types/auth';

interface WorkflowActionPanelProps {
  po: PurchaseOrder;
  currentUser: AuthUser;
  onActionComplete: () => void; // refresh PO data after action
}

export function WorkflowActionPanel({ po, currentUser, onActionComplete }: WorkflowActionPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handle = async (action: () => Promise<unknown>, key: string) => {
    setLoading(key);
    setError(null);
    try {
      await action();
      onActionComplete();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Action failed. Please try again.';
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  const actions: React.ReactNode[] = [];

  // --- SUBMIT ---
  if (canSubmitPO(po, currentUser)) {
    actions.push(
      <Button
        key="submit"
        onClick={() => handle(() => workflowApi.submit(po.id), 'submit')}
        loading={loading === 'submit'}
      >
        Submit for Approval
      </Button>,
    );
  }

  // --- MANAGER APPROVE ---
  if (canApproveAsManager(po, currentUser)) {
    actions.push(
      <Button
        key="approve-manager"
        onClick={() => handle(
          () => workflowApi.approveManager(po.id, { comment: comment || undefined }),
          'approve-manager',
        )}
        loading={loading === 'approve-manager'}
      >
        Approve (Manager)
      </Button>,
    );
  }

  // --- IT APPROVE ---
  if (canApproveAsIT(po, currentUser)) {
    actions.push(
      <Button
        key="approve-it"
        onClick={() => handle(
          () => workflowApi.approveIT(po.id, { comment: comment || undefined }),
          'approve-it',
        )}
        loading={loading === 'approve-it'}
      >
        Validate (IT)
      </Button>,
    );
  }

  // --- FINANCE APPROVE ---
  if (canApproveAsFinance(po, currentUser)) {
    actions.push(
      <Button
        key="approve-finance"
        onClick={() => handle(
          () => workflowApi.approveFinance(po.id, { comment: comment || undefined }),
          'approve-finance',
        )}
        loading={loading === 'approve-finance'}
      >
        Approve (Finance)
      </Button>,
    );
  }

  // --- REJECT ---
  if (canReject(po, currentUser)) {
    actions.push(
      <Button
        key="reject"
        variant="danger"
        onClick={() => setShowRejectForm(true)}
      >
        Reject
      </Button>,
    );
  }

  // --- COMPLETE ---
  if (canComplete(po, currentUser)) {
    actions.push(
      <Button
        key="complete"
        variant="secondary"
        onClick={() => setShowCompleteForm(true)}
      >
        Mark as Completed
      </Button>,
    );
  }

  if (actions.length === 0 && !showRejectForm && !showCompleteForm) {
    return null; // No actions available for this user on this PO
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

      {/* Optional comment for approve actions */}
      {(canApproveAsManager(po, currentUser) ||
        canApproveAsIT(po, currentUser) ||
        canApproveAsFinance(po, currentUser)) && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Comment <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note with your approval..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
          />
        </div>
      )}

      {/* Action buttons */}
      {!showRejectForm && !showCompleteForm && (
        <div className="flex flex-wrap gap-2">{actions}</div>
      )}

      {/* Reject form */}
      {showRejectForm && (
        <div className="space-y-3 border border-red-200 rounded-md p-4 bg-red-50">
          <p className="text-sm font-medium text-red-800">Reject this PO</p>
          <div>
            <label className="block text-xs font-medium text-red-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this PO is being rejected..."
              className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              loading={loading === 'reject'}
              disabled={!rejectReason.trim()}
              onClick={() => handle(
                () => workflowApi.reject(po.id, { reason: rejectReason }),
                'reject',
              )}
            >
              Confirm Rejection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Complete form */}
      {showCompleteForm && (
        <div className="space-y-3 border border-gray-200 rounded-md p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-800">Mark PO as Completed</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Invoice Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="e.g. INV-2026-0042"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={loading === 'complete'}
              disabled={!invoiceRef.trim()}
              onClick={() => handle(
                () => workflowApi.complete(po.id, { invoice_reference: invoiceRef }),
                'complete',
              )}
            >
              Confirm Completion
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowCompleteForm(false); setInvoiceRef(''); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
