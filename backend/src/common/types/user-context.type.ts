// This is the enriched user object attached to every authenticated request.
// The JWT gives us the Supabase user ID; we load the rest from the DB.
export interface AuthUser {
  id: string; // Supabase auth.users UUID
  email: string;
  fullName: string;
  departmentId: string | null;
  roles: string[]; // Array of role codes: ['employee', 'manager']
}
