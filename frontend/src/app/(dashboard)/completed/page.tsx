'use client';
import { TopBar } from '../../../components/layout/TopBar';
export default function CompletedPage() {
  return (
    <>
      <TopBar title="Completed POs" />
      <div className="p-6">
        <p className="text-sm text-gray-500">Completed POs — coming in Phase 5.</p>
      </div>
    </>
  );
}