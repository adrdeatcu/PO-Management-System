'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TopBar } from '../../../../../components/layout/TopBar';
import { POForm } from '../../../../../components/purchase-orders/POForm';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { purchaseOrdersApi } from '../../../../../lib/api/purchase-orders';
import { useCurrentUser } from '../../../../../hooks/useCurrentUser';
import { canEditPO } from '../../../../../lib/utils/permissions';
import type { PurchaseOrder } from '../../../../../types/purchase-order';

export default function EditPOPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useCurrentUser();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    purchaseOrdersApi.getOne(id).then((data) => {
      setPO(data);
      // Client-side guard — backend also enforces this
      if (currentUser && !canEditPO(data, currentUser)) {
        setUnauthorized(true);
      }
    }).finally(() => setLoading(false));
  }, [id, currentUser]);

  if (loading) return <LoadingSpinner />;

  if (unauthorized) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          You cannot edit this PO in its current state.
        </p>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Purchase order not found.</p>
      </div>
    );
  }

  return (
    <>
      <TopBar title={`Edit ${po.po_number}`} />
      <div className="p-6">
        {po.status === 'needs_rework' && po.last_rejection_reason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl">
            <p className="text-sm font-medium text-red-800">Rejection reason</p>
            <p className="text-sm text-red-700 mt-1">&ldquo;{po.last_rejection_reason}&rdquo;</p>
          </div>
        )}
        <POForm mode="edit" initialData={po} />
      </div>
    </>
  );
}