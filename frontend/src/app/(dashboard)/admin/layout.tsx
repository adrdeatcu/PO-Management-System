'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

// Admin layout — guards all /admin/* routes
// If user doesn't have admin role, redirect to dashboard
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser && !currentUser.roles.includes('admin')) {
      router.push('/dashboard');
    }
  }, [loading, currentUser, router]);

  if (loading) return <LoadingSpinner />;
  if (!currentUser?.roles.includes('admin')) return null;

  return <>{children}</>;
}