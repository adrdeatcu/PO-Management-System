'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import { POStatusBadge } from '../../../components/purchase-orders/POStatusBadge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { workflowApi } from '../../../lib/api/workflow';
import { formatCurrency, formatDateShort } from '../../../lib/utils/format';
import type { PurchaseOrder } from '../../../types/purchase-order';

export default function ApprovalsPage() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowApi.getInbox()
      .then(setPOs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title="Approval Inbox" />
      <div className="p-6">
        {loading ? (
          <LoadingSpinner />
        ) : pos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">Your approval inbox is empty.</p>
            <p className="text-xs text-gray-400 mt-1">
              Purchase orders assigned to you for review will appear here.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {pos.length} purchase order{pos.length !== 1 ? 's' : ''} awaiting your review.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['PO Number', 'Title', 'Amount', 'Category', 'Status', 'Submitted', ''].map((h) => (
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
                      <td className="px-4 py-3"><POStatusBadge status={po.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(po.submitted_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className="text-sm text-teal-700 hover:underline font-medium"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}