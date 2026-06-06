'use client';

import { useEffect, useState } from 'react';
import apiClient from '../lib/api/client';
import type { AuthUser } from '../types/auth';

// Fetches the enriched user (with roles + department) from NestJS backend
// This is different from useAuth which only gives the Supabase auth user
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/profiles/me')
      .then(({ data }) => {
        // Map backend snake_case to our AuthUser shape
        setCurrentUser({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          departmentId: data.department_id ?? null,
          roles: (data.user_roles ?? []).flatMap(
            (ur: { roles: { code: string } | null }) =>
              ur.roles ? [ur.roles.code] : [],
          ),
        });
      })
      .catch(() => setError('Failed to load user profile'))
      .finally(() => setLoading(false));
  }, []);

  return { currentUser, loading, error };
}
