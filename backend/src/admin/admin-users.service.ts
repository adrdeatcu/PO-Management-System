import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly db: DatabaseService) {}

  // ── List all users with their roles and department ────────
  async getAllUsers(search?: string) {
    let query = this.db.client
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        department_id,
        created_at,
        departments(id, name, code)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: profiles, error } = await query;
    if (error) throw new BadRequestException(error.message);

    // Fetch roles for each user
    const userIds = (profiles ?? []).map((p) => p.id);
    if (userIds.length === 0) return [];

    const { data: allUserRoles } = await this.db.client
      .from('user_roles')
      .select('user_id, roles(id, code, name)')
      .in('user_id', userIds);

    // Merge roles into each profile
    return (profiles ?? []).map((profile) => ({
      ...profile,
      roles: (allUserRoles ?? [])
        .filter((ur) => ur.user_id === profile.id)
        .map((ur) => ur.roles)
        .filter(Boolean),
    }));
  }

  // ── Create user via Supabase Admin Auth API ───────────────
  // This is the safe way — we never expose password hashing.
  // Supabase handles it; we just patch the profile after creation.
  async createUser(dto: CreateUserDto) {
    // 1. Create auth user via Supabase Admin API
    const { data: authData, error: authError } =
      await this.db.adminClient.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true, // Skip email confirmation for internal tool
        user_metadata: { full_name: dto.full_name },
      });

    if (authError) throw new BadRequestException(authError.message);
    const newUserId = authData.user.id;

    // 2. The handle_new_user trigger auto-creates the profile row.
    //    We now patch it with the correct full_name and department.
    const { error: profileError } = await this.db.client
      .from('profiles')
      .update({
        full_name: dto.full_name,
        department_id: dto.department_id ?? null,
      })
      .eq('id', newUserId);

    if (profileError) throw new BadRequestException(profileError.message);

    // 3. Assign default 'employee' role + any additional roles
    const roleCodes = ['employee', ...(dto.role_codes ?? [])];
    const uniqueRoleCodes = [...new Set(roleCodes)];

    const { data: roles } = await this.db.client
      .from('roles')
      .select('id, code')
      .in('code', uniqueRoleCodes);

    if (roles && roles.length > 0) {
      const roleInserts = roles.map((role) => ({
        user_id: newUserId,
        role_id: role.id,
      }));

      await this.db.client
        .from('user_roles')
        .upsert(roleInserts, { onConflict: 'user_id,role_id' });
    }

    return { id: newUserId, message: 'User created successfully.' };
  }

  // ── Update user's department ──────────────────────────────
  async updateDepartment(userId: string, departmentId: string | null) {
    const { error } = await this.db.client
      .from('profiles')
      .update({ department_id: departmentId })
      .eq('id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Department updated.' };
  }

  // ── Assign a role to a user ───────────────────────────────
  async assignRole(userId: string, roleId: string) {
    const { error } = await this.db.client
      .from('user_roles')
      .upsert({ user_id: userId, role_id: roleId }, { onConflict: 'user_id,role_id' });

    if (error) throw new BadRequestException(error.message);
    return { message: 'Role assigned.' };
  }

  // ── Remove a role from a user ─────────────────────────────
  async removeRole(userId: string, roleId: string) {
    const { error } = await this.db.client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Role removed.' };
  }

  // ── Get all POs (admin overview) ──────────────────────────
  async getAllPOs(status?: string, search?: string) {
    let query = this.db.client
      .from('purchase_orders')
      .select(`
        id, po_number, title, amount, currency, category,
        status, current_stage, created_at, submitted_at, completed_at,
        is_manager_approval_required, is_it_validation_required,
        resubmission_count, invoice_reference,
        profiles!purchase_orders_created_by_fkey(full_name, email),
        departments(name, code)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}