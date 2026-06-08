'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopBar } from '../../../../components/layout/TopBar';
import { POStatusBadge } from '../../../../components/purchase-orders/POStatusBadge';
import { POTimeline } from '../../../../components/purchase-orders/POTimeline';
import { WorkflowActionPanel } from '../../../../components/purchase-orders/WorkflowActionPanel';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Button } from '../../../../components/ui/Button';
import { purchaseOrdersApi } from '../../../../lib/api/purchase-orders';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { canEditPO } from '../../../../lib/utils/permissions';
import { formatCurrency, formatDate } from '../../../../lib/utils/format';
import type { POWithActions } from '../../../../types/purchase-order';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [po, setPO] = useState<POWithActions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPO = useCallback(async () => {
    try {
      const data = await purchaseOrdersApi.getOne(id);
      setPO(data);
    } catch {
      setError('Could not load this purchase order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPO(); }, [fetchPO]);

  if (loading) return <LoadingSpinner />;

  if (error || !po) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error ?? 'Purchase order not found.'}</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const canEdit = currentUser ? canEditPO(po, currentUser) : false;

  return (
    <>
      <TopBar
        title={po.po_number}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/purchase-orders/${po.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} />
                  Edit
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Rework banner */}
        {po.status === 'needs_rework' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">This PO needs rework</p>
            {po.last_rejection_reason && (
              <p className="text-sm text-red-700 mt-1">
                Reason: &ldquo;{po.last_rejection_reason}&rdquo;
              </p>
            )}
            {canEdit && (
              <Link href={`/purchase-orders/${po.id}/edit`} className="mt-3 inline-block">
                <Button size="sm" variant="danger">Edit and Resubmit</Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: PO Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{po.title}</h2>
                  {po.description && (
                    <p className="text-sm text-gray-500 mt-1">{po.description}</p>
                  )}
                </div>
                <POStatusBadge status={po.status} />
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(po.amount, po.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd className="text-gray-900">{po.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Current Stage</dt>
                  <dd className="text-gray-900 capitalize">{po.current_stage}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Version</dt>
                  <dd className="text-gray-900">v{po.version_no}</dd>
                </div>
                {po.resubmission_count > 0 && (
                  <div>
                    <dt className="text-gray-500">Resubmissions</dt>
                    <dd className="text-gray-900">{po.resubmission_count}</dd>
                  </div>
                )}
                {po.invoice_reference && (
                  <div>
                    <dt className="text-gray-500">Invoice Reference</dt>
                    <dd className="text-gray-900 font-mono">{po.invoice_reference}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Workflow flags */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Approval Path</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${po.is_manager_approval_required ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                  {po.is_manager_approval_required ? '✓' : '–'} Manager Approval
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${po.is_it_validation_required ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                  {po.is_it_validation_required ? '✓' : '–'} IT Validation
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  ✓ Finance Approval
                </span>
              </div>

              {/* Milestone timestamps */}
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-500">
                {po.submitted_at && (
                  <div>
                    Submitted:{' '}
                    <span className="text-gray-700">{formatDate(po.submitted_at)}</span>
                  </div>
                )}
                {po.manager_approved_at && (
                  <div>
                    Manager approved:{' '}
                    <span className="text-gray-700">{formatDate(po.manager_approved_at)}</span>
                  </div>
                )}
                {po.it_validated_at && (
                  <div>
                    IT validated:{' '}
                    <span className="text-gray-700">{formatDate(po.it_validated_at)}</span>
                  </div>
                )}
                {po.finance_approved_at && (
                  <div>
                    Finance approved:{' '}
                    <span className="text-gray-700">{formatDate(po.finance_approved_at)}</span>
                  </div>
                )}
                {po.completed_at && (
                  <div>
                    Completed:{' '}
                    <span className="text-gray-700">{formatDate(po.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <POTimeline actions={po.actions ?? []} />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            {currentUser && (
              <WorkflowActionPanel
                po={po}
                currentUser={currentUser}
                onActionComplete={fetchPO}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}