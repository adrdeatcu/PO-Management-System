'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../../components/layout/TopBar';
import { POStatusBadge } from '../../../../components/purchase-orders/POStatusBadge';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { adminApi } from '../../../../lib/api/admin';
import { formatCurrency, formatDateShort } from '../../../../lib/utils/format';
import { Search } from 'lucide-react';
import type { POStatus } from '../../../../types/purchase-order';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',                label: 'All statuses'      },
  { value: 'draft',           label: 'Draft'             },
  { value: 'pending_manager', label: 'Pending Manager'   },
  { value: 'pending_it',      label: 'Pending IT'        },
  { value: 'pending_finance', label: 'Pending Finance'   },
  { value: 'approved',        label: 'Approved'          },
  { value: 'needs_rework',    label: 'Needs Rework'      },
  { value: 'completed',       label: 'Completed'         },
];

export default function AdminPOsPage() {
  const [pos, setPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    const data = await adminApi.getAllPOs({
      status: statusFilter || undefined,
      search: search || undefined,
    });
    setPOs(data ?? []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  return (
    <>
      <TopBar title="All Purchase Orders" />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <p className="text-sm text-gray-500 mb-3">{pos.length} result{pos.length !== 1 ? 's' : ''}</p>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['PO Number', 'Title', 'Requestor', 'Amount', 'Status', 'Stage', 'Created', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pos.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{po.po_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs truncate">{po.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {po.profiles?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{formatCurrency(po.amount)}</td>
                      <td className="px-4 py-3"><POStatusBadge status={po.status as POStatus} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 capitalize">{po.current_stage}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(po.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/purchase-orders/${po.id}`} className="text-sm text-teal-700 hover:underline font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No purchase orders match the current filters.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}