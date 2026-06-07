'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { purchaseOrdersApi } from '../../lib/api/purchase-orders';
import type { PurchaseOrder, POCategory } from '../../types/purchase-order';
import { ApprovalPathPreview } from './ApprovalPathPreview';

const CATEGORIES: POCategory[] = [
  'IT Equipment',
  'Office Supplies',
  'Software & Licenses',
  'Travel & Accommodation',
  'Consulting & Services',
  'Marketing & Advertising',
  'Facilities & Maintenance',
  'Other',
];

interface POFormProps {
  mode: 'create' | 'edit';
  initialData?: PurchaseOrder;
}

export function POForm({ mode, initialData }: POFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [category, setCategory] = useState<POCategory>(initialData?.category ?? 'Office Supplies');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        const po = await purchaseOrdersApi.create({
          title,
          description: description || undefined,
          amount: parsedAmount,
          category,
        });
        router.push(`/purchase-orders/${po.id}`);
      } else if (mode === 'edit' && initialData) {
        await purchaseOrdersApi.update(initialData.id, {
          title,
          description: description || undefined,
          amount: parsedAmount,
          category,
        });
        router.push(`/purchase-orders/${initialData.id}`);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. MacBook Pro for new hire"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="ml-1 text-xs text-gray-400">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide context, justification, or vendor details..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none"
        />
      </div>

      {/* Amount + Category — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              id="amount"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
          {amount && parseFloat(amount) < 100 && (
            <p className="mt-1 text-xs text-blue-600">
              ℹ Manager approval will be skipped (amount under $100)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as POCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {category === 'IT Equipment' && (
            <p className="mt-1 text-xs text-orange-600">
              ⚠ IT validation will be required for this category
            </p>
          )}
        </div>
      </div>

      {/* Live approval path preview */}
      <ApprovalPathPreview amount={amount} category={category} />

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Save as Draft' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}