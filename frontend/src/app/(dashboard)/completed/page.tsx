'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { purchaseOrdersApi } from '../../../lib/api/purchase-orders';
import { formatCurrency, formatDateShort } from '../../../lib/utils/format';
import type { PurchaseOrder } from '../../../types/purchase-order';

export default function CompletedPage() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseOrdersApi.getMyPOs({ status: 'completed' })
      .then(setPOs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title="Completed POs" />
      <div className="p-6">
        {loading ? (
          <LoadingSpinner />
        ) : pos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">No completed purchase orders yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['PO Number', 'Title', 'Amount', 'Category', 'Invoice Ref', 'Completed', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{po.po_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs truncate">{po.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{formatCurrency(po.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{po.category}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{po.invoice_reference ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(po.completed_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/purchase-orders/${po.id}`} className="text-sm text-teal-700 hover:underline font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}