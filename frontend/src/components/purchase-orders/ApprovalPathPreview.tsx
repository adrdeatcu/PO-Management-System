'use client';

import type { POCategory } from '../../types/purchase-order';

interface ApprovalPathPreviewProps {
  amount: string;
  category: POCategory;
}

export function ApprovalPathPreview({ amount, category }: ApprovalPathPreviewProps) {
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const managerRequired = isAmountValid ? parsedAmount >= 100 : false;
  const itRequired = category === 'IT Equipment';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Approval Path Preview</h3>
      <p className="text-xs text-gray-500 mb-3">
        This shows how your PO will flow through approvals based on the amount and category.
      </p>

      <div className="flex flex-wrap gap-2">
        {/* Manager */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            managerRequired
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-100 text-gray-400 line-through'
          }`}
        >
          {managerRequired ? '✓' : '–'} Manager Approval
        </span>

        {/* IT */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            itRequired
              ? 'bg-orange-50 text-orange-700'
              : 'bg-gray-100 text-gray-400 line-through'
          }`}
        >
          {itRequired ? '✓' : '–'} IT Validation
        </span>

        {/* Finance — always required */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
          ✓ Finance Approval
        </span>
      </div>

      {/* Helper hint about manager threshold */}
      <p className="mt-3 text-xs text-gray-500">
        Manager approval is required when the amount is <span className="font-semibold">$100 or more</span>.
      </p>
    </div>
  );
}