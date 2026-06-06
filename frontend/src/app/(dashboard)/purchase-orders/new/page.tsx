'use client';

import { TopBar } from '../../../../components/layout/TopBar';
import { POForm } from '../../../../components/purchase-orders/POForm';

export default function NewPOPage() {
  return (
    <>
      <TopBar title="Create Purchase Order" />
      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Fill in the details below. Your PO will be saved as a draft — you can review and submit it when ready.
          </p>
        </div>
        <POForm mode="create" />
      </div>
    </>
  );
}