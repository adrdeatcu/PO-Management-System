export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
  departments?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  roles: string[];
}
