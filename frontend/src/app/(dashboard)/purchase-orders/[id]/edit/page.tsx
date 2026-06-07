'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '../../../../../components/layout/TopBar';
import { POForm } from '../../../../../components/purchase-orders/POForm';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { Button } from '../../../../../components/ui/Button';
import { purchaseOrdersApi } from '../../../../../lib/api/purchase-orders';
import { useCurrentUser } from '../../../../../hooks/useCurrentUser';
import { canEditPO } from '../../../../../lib/utils/permissions';
import type { PurchaseOrder } from '../../../../../types/purchase-order';
import { ArrowLeft } from 'lucide-react';

export default function EditPOPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    purchaseOrdersApi
      .getOne(id)
      .then((data) => {
        // Guard: only the creator of a draft/needs_rework PO can reach this page
        if (currentUser && !canEditPO(data, currentUser)) {
          router.replace(`/purchase-orders/${id}`);
          return;
        }
        setPO(data);
      })
      .catch(() => setError('Could not load this purchase order.'))
      .finally(() => setLoading(false));
  }, [id, currentUser, router]);

  if (loading) return <LoadingSpinner />;

  if (error || !po) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error ?? 'Purchase order not found.'}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => router.push(`/purchase-orders/${id}`)}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <TopBar
        title={`Edit ${po.po_number}`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/purchase-orders/${id}`)}
          >
            <ArrowLeft size={14} />
            Back to PO
          </Button>
        }
      />

      <div className="p-6">
        {/* Rework notice */}
        {po.status === 'needs_rework' && po.last_rejection_reason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl">
            <p className="text-sm font-medium text-red-800">Rejection reason</p>
            <p className="text-sm text-red-700 mt-1">
              &ldquo;{po.last_rejection_reason}&rdquo;
            </p>
            <p className="text-xs text-red-500 mt-2">
              Edit the details below to address the feedback, then save and resubmit.
            </p>
          </div>
        )}

        <div className="mb-5 max-w-2xl">
          <p className="text-sm text-gray-500">
            {po.status === 'needs_rework'
              ? 'Update the details below to address the rejection feedback. After saving, you can resubmit from the PO detail page.'
              : 'Update the details below. Your changes will be saved as a draft.'}
          </p>
        </div>

        <POForm mode="edit" initialData={po} />
      </div>
    </>
  );
}