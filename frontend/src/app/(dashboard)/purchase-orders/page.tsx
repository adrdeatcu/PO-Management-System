'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopBar } from '../../../components/layout/TopBar';
import { Button } from '../../../components/ui/Button';
import { POStatusBadge } from '../../../components/purchase-orders/POStatusBadge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { purchaseOrdersApi } from '../../../lib/api/purchase-orders';
import { formatCurrency, formatDateShort } from '../../../lib/utils/format';
import type { PurchaseOrder, POStatus } from '../../../types/purchase-order';
import { Plus, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

// ── Filter tab definitions ──────────────────────────────────────────────────

interface FilterTab {
  label: string;
  value: string; // '' = All
}

const FILTER_TABS: FilterTab[] = [
  { label: 'All',             value: ''               },
  { label: 'Draft',           value: 'draft'          },
  { label: 'Pending',         value: 'pending'        }, // virtual — maps to 3 statuses
  { label: 'Needs Rework',    value: 'needs_rework'   },
  { label: 'Completed',       value: 'completed'      },
];

// "Pending" is a UI-level grouping of 3 backend statuses
const PENDING_STATUSES: POStatus[] = ['pending_manager', 'pending_it', 'pending_finance'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function matchesFilter(po: PurchaseOrder, activeFilter: string): boolean {
  if (!activeFilter) return true;
  if (activeFilter === 'pending') return (PENDING_STATUSES as string[]).includes(po.status);
  return po.status === activeFilter;
}

function matchesSearch(po: PurchaseOrder, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    po.title.toLowerCase().includes(q) ||
    po.po_number.toLowerCase().includes(q) ||
    po.category.toLowerCase().includes(q)
  );
}

// ── Page component ───────────────────────────────────────────────────────────

export default function MyPOsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter from URL query param (?status=draft etc.)
  const initialStatus = searchParams.get('status') ?? '';
  // Normalize URL status values to our tab values
  const normalizeStatus = (s: string) => {
    if (['pending_manager', 'pending_it', 'pending_finance', 'submitted'].includes(s)) return 'pending';
    return s;
  };

  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>(normalizeStatus(initialStatus));
  const [search, setSearch] = useState('');

  // Fetch all POs once — filtering is done client-side for instant transitions
  useEffect(() => {
    purchaseOrdersApi.getMyPOs()
      .then(setAllPOs)
      .finally(() => setLoading(false));
  }, []);

  // Sync filter changes to URL without full navigation
  const handleFilterChange = useCallback((value: string) => {
    setActiveFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Derived filtered list
  const filteredPOs = allPOs
    .filter((po) => matchesFilter(po, activeFilter))
    .filter((po) => matchesSearch(po, search));

  // Count per tab for badges
  const countFor = (value: string) => {
    if (!value) return allPOs.length;
    return allPOs.filter((po) => matchesFilter(po, value)).length;
  };

  return (
    <>
      <TopBar
        title="My Purchase Orders"
        actions={
          <Link href="/purchase-orders/new">
            <Button size="sm">
              <Plus size={16} />
              New PO
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-4">

        {/* ── Filter bar + Search row ─────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Pill filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            {FILTER_TABS.map((tab) => {
              const count = countFor(tab.value);
              const isActive = activeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleFilterChange(tab.value)}
                  className={clsx(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                  )}
                >
                  {tab.label}
                  {/* Count badge — only show when not loading and count > 0 */}
                  {!loading && count > 0 && (
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-semibold tabular-nums transition-colors duration-200',
                        isActive
                          ? 'bg-teal-700 text-white'
                          : 'bg-gray-300 text-gray-600',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, PO number..."
              className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent w-64 transition-shadow"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Table / States ──────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredPOs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
            {search ? (
              <>
                <p className="text-sm font-medium text-gray-700">No results for &ldquo;{search}&rdquo;</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term or clear the filter.</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-sm text-teal-700 hover:underline font-medium"
                >
                  Clear search
                </button>
              </>
            ) : activeFilter ? (
              <>
                <p className="text-sm font-medium text-gray-700">
                  No {FILTER_TABS.find(t => t.value === activeFilter)?.label.toLowerCase()} purchase orders.
                </p>
                <button
                  onClick={() => handleFilterChange('')}
                  className="mt-3 text-sm text-teal-700 hover:underline font-medium"
                >
                  View all POs
                </button>
              </>
            ) : (
              <>
                <p className="text-sm">No purchase orders yet.</p>
                <Link href="/purchase-orders/new" className="mt-3 inline-block">
                  <Button size="sm">Create your first PO</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

            {/* Result count */}
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {filteredPOs.length === allPOs.length
                  ? `${allPOs.length} purchase order${allPOs.length !== 1 ? 's' : ''}`
                  : `${filteredPOs.length} of ${allPOs.length} purchase orders`}
              </p>
              {(activeFilter || search) && (
                <button
                  onClick={() => { handleFilterChange(''); setSearch(''); }}
                  className="text-xs text-teal-700 hover:underline font-medium flex items-center gap-1"
                >
                  <X size={12} />
                  Clear filters
                </button>
              )}
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['PO Number', 'Title', 'Amount', 'Category', 'Status', 'Created', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{po.po_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs truncate">{po.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{formatCurrency(po.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{po.category}</td>
                    <td className="px-4 py-3"><POStatusBadge status={po.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(po.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/purchase-orders/${po.id}`}
                        className="text-sm text-teal-700 hover:underline font-medium"
                      >
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