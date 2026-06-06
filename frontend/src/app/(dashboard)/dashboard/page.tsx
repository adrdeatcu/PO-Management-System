'use client';

import { TopBar } from '../../../components/layout/TopBar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export default function DashboardPage() {
  const { currentUser } = useCurrentUser();

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-base font-medium text-gray-900">
            Welcome back, {currentUser?.fullName ?? '...'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s an overview of your purchase order activity.
          </p>
        </div>

        {/* Placeholder cards — will be filled in Phase 5 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {['My Draft POs', 'Pending Approval', 'Completed This Month'].map((label) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}