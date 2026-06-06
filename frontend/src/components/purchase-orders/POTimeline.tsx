'use client';

import { formatDate } from '../../lib/utils/format';
import type { POAction } from '../../types/purchase-order';

const actionLabels: Record<string, string> = {
  created:           'PO Created',
  submitted:         'Submitted for Approval',
  resubmitted:       'Resubmitted after Rework',
  approved_manager:  'Approved by Manager',
  approved_it:       'Validated by IT',
  approved_finance:  'Approved by Finance',
  rejected:          'Rejected',
  returned_for_rework: 'Returned for Rework',
  completed:         'Marked as Completed',
  edited:            'PO Edited',
};

const actionColors: Record<string, string> = {
  approved_manager:  'bg-green-500',
  approved_it:       'bg-green-500',
  approved_finance:  'bg-green-500',
  completed:         'bg-green-600',
  rejected:          'bg-red-500',
  returned_for_rework: 'bg-red-400',
  submitted:         'bg-blue-500',
  resubmitted:       'bg-blue-400',
  created:           'bg-gray-400',
  edited:            'bg-gray-400',
};

interface POTimelineProps {
  actions: POAction[];
}

export function POTimeline({ actions }: POTimelineProps) {
  if (actions.length === 0) {
    return <p className="text-sm text-gray-500">No activity yet.</p>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {actions.map((action, index) => (
          <li key={action.id}>
            <div className="relative pb-8">
              {index < actions.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${actionColors[action.action_type] ?? 'bg-gray-400'}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {actionLabels[action.action_type] ?? action.action_type}
                    </p>
                    {action.comment && (
                      <p className="mt-0.5 text-sm text-gray-500">
                        &ldquo;{action.comment}&rdquo;
                      </p>
                    )}
                    {action.profiles && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        by {action.profiles.full_name}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-400">
                    {formatDate(action.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}