import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client — used in Client Components
// Safe to call multiple times; createBrowserClient handles singleton internally
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
