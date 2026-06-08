import {
  Injectable,
  BadRequestException,
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

    const userIds = (profiles ?? []).map((p) => p.id);
    if (userIds.length === 0) return [];

    const { data: allUserRoles } = await this.db.client
      .from('user_roles')
      .select('user_id, roles(id, code, name)')
      .in('user_id', userIds);

    return (profiles ?? []).map((profile) => ({
      ...profile,
      roles: (allUserRoles ?? [])
        .filter((ur) => ur.user_id === profile.id)
        .map((ur) => ur.roles)
        .filter(Boolean),
    }));
  }

  // ── Create user via Supabase Admin Auth API ───────────────
  async createUser(dto: CreateUserDto) {
    const { data: authData, error: authError } =
      await this.db.adminClient.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: { full_name: dto.full_name },
      });

    if (authError) throw new BadRequestException(authError.message);
    const newUserId = authData.user.id;

    const { error: profileError } = await this.db.client
      .from('profiles')
      .update({
        full_name: dto.full_name,
        department_id: dto.department_id ?? null,
      })
      .eq('id', newUserId);

    if (profileError) throw new BadRequestException(profileError.message);

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
  // Uses separate queries to avoid PostgREST FK ambiguity on profiles join
  async getAllPOs(status?: string, search?: string) {
    let query = this.db.client
      .from('purchase_orders')
      .select(`
        id, po_number, title, amount, currency, category,
        status, current_stage, created_at, submitted_at, completed_at,
        is_manager_approval_required, is_it_validation_required,
        resubmission_count, invoice_reference,
        created_by, department_id
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data: pos, error } = await query;
    if (error) throw new BadRequestException(error.message);
    if (!pos || pos.length === 0) return [];

    // Collect unique IDs for batch lookups
    const creatorIds = [...new Set(pos.map((po) => po.created_by).filter(Boolean))];
    const deptIds = [...new Set(pos.map((po) => po.department_id).filter(Boolean))];

    const [{ data: profiles }, { data: departments }] = await Promise.all([
      this.db.client
        .from('profiles')
        .select('id, full_name, email')
        .in('id', creatorIds),
      this.db.client
        .from('departments')
        .select('id, name, code')
        .in('id', deptIds),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const deptMap = Object.fromEntries((departments ?? []).map((d) => [d.id, d]));

    return pos.map((po) => ({
      ...po,
      profiles: profileMap[po.created_by] ?? null,
      departments: deptMap[po.department_id] ?? null,
    }));
  }

  // ── Set department manager and ensure manager role ────────
  async setDepartmentManager(userId: string, departmentId: string) {
    // 1) Get manager role id
    const { data: managerRole, error: roleError } = await this.db.client
      .from('roles')
      .select('id')
      .eq('code', 'manager')
      .single();

    if (roleError || !managerRole) {
      throw new BadRequestException('Manager role not found.');
    }

    // 2) Fetch department
    const { data: dept, error: deptError } = await this.db.client
      .from('departments')
      .select('id, manager_user_id')
      .eq('id', departmentId)
      .single();

    if (deptError || !dept) {
      throw new BadRequestException('Department not found.');
    }

    const previousManagerId = dept.manager_user_id ?? null;

    // 3) Ensure user belongs to this department
    const { data: profile, error: profileError } = await this.db.client
      .from('profiles')
      .select('id, department_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new BadRequestException('User profile not found.');
    }

    if (profile.department_id !== departmentId) {
      throw new BadRequestException(
        'User must belong to the department in order to become its manager.',
      );
    }

    // 4) Set this user as department manager
    const { error: updateError } = await this.db.client
      .from('departments')
      .update({ manager_user_id: userId })
      .eq('id', departmentId);

    if (updateError) throw new BadRequestException(updateError.message);

    // 5) Ensure user has manager role
    const { error: roleAssignError } = await this.db.client
      .from('user_roles')
      .upsert(
        { user_id: userId, role_id: managerRole.id },
        { onConflict: 'user_id,role_id' },
      );

    if (roleAssignError) throw new BadRequestException(roleAssignError.message);

    return {
      message: 'Department manager updated.',
      previous_manager_id: previousManagerId,
    };
  }
}