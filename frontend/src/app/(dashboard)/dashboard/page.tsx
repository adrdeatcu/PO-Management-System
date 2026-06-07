'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { purchaseOrdersApi, type DashboardStats } from '../../../lib/api/purchase-orders';
import { FileText, Clock, CheckCircle, AlertCircle, Inbox, Plus } from 'lucide-react';

const APPROVER_ROLES = ['manager', 'it', 'finance', 'admin'];

export default function DashboardPage() {
  const { currentUser } = useCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isApprover = currentUser?.roles.some((r) => APPROVER_ROLES.includes(r)) ?? false;

  useEffect(() => {
    purchaseOrdersApi
      .getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title="Dashboard" />

      <div className="p-6 space-y-6">

        {/* Welcome */}
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Welcome back, {currentUser?.fullName ?? '...'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s an overview of your purchase order activity.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* My Draft POs */}
          <Link
            href="/purchase-orders?status=draft"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">My Draft POs</p>
              <span className="p-2 rounded-lg bg-gray-100 text-gray-500">
                <FileText size={18} />
              </span>
            </div>
            <p className={`text-2xl font-semibold tabular-nums ${loading ? 'text-gray-300' : 'text-gray-900'}`}>
              {loading ? '—' : (stats?.my_draft ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-teal-600 transition-colors">
              View all →
            </p>
          </Link>

          {/* Pending Approval */}
          <Link
            href="/purchase-orders?status=pending_manager"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Pending Approval</p>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-500">
                <Clock size={18} />
              </span>
            </div>
            <p className={`text-2xl font-semibold tabular-nums ${loading ? 'text-gray-300' : 'text-blue-700'}`}>
              {loading ? '—' : (stats?.my_pending_approval ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-teal-600 transition-colors">
              View all →
            </p>
          </Link>

          {/* Needs Rework */}
          <Link
            href="/purchase-orders?status=needs_rework"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Needs Rework</p>
              <span className="p-2 rounded-lg bg-red-50 text-red-500">
                <AlertCircle size={18} />
              </span>
            </div>
            <p className={`text-2xl font-semibold tabular-nums ${loading ? 'text-gray-300' : 'text-red-700'}`}>
              {loading ? '—' : (stats?.my_needs_rework ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-teal-600 transition-colors">
              View all →
            </p>
          </Link>

          {/* Completed This Month */}
          <Link
            href="/completed"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Completed This Month</p>
              <span className="p-2 rounded-lg bg-green-50 text-green-500">
                <CheckCircle size={18} />
              </span>
            </div>
            <p className={`text-2xl font-semibold tabular-nums ${loading ? 'text-gray-300' : 'text-green-700'}`}>
              {loading ? '—' : (stats?.my_completed_this_month ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-teal-600 transition-colors">
              View all →
            </p>
          </Link>

        </div>

        {/* Approver inbox card — only visible to managers, IT, finance, admin */}
        {isApprover && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/approvals"
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Awaiting My Action</p>
                <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
                  <Inbox size={18} />
                </span>
              </div>
              <p className={`text-2xl font-semibold tabular-nums ${loading ? 'text-gray-300' : 'text-teal-700'}`}>
                {loading ? '—' : (stats?.inbox_pending ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1 group-hover:text-teal-600 transition-colors">
                Go to inbox →
              </p>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/purchase-orders/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors"
            >
              <Plus size={16} />
              New Purchase Order
            </Link>
            <Link
              href="/purchase-orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <FileText size={16} />
              My Purchase Orders
            </Link>
            {isApprover && (
              <Link
                href="/approvals"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <Inbox size={16} />
                Approval Inbox
                {!loading && stats?.inbox_pending ? (
                  <span className="ml-1 px-1.5 py-0.5 bg-teal-700 text-white text-xs rounded-full">
                    {stats.inbox_pending}
                  </span>
                ) : null}
              </Link>
            )}
          </div>
        </div>

        {/* Needs Rework Alert Banner */}
        {!loading && stats && stats.my_needs_rework > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {stats.my_needs_rework} purchase order{stats.my_needs_rework > 1 ? 's' : ''} need{stats.my_needs_rework === 1 ? 's' : ''} your attention
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                These POs were rejected and are waiting for you to edit and resubmit.
              </p>
              <Link
                href="/purchase-orders?status=needs_rework"
                className="inline-block mt-2 text-sm font-medium text-red-700 underline"
              >
                Review now →
              </Link>
            </div>
          </div>
        )}

      </div>
    </>
  );
}