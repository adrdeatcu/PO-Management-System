import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  // ── List all users with their profiles, departments, and roles ──
  async findAll(search?: string) {
    let query = this.db.client
      .from('profiles')
      .select(`
        id, full_name, email, created_at,
        departments(id, name, code),
        user_roles(roles(id, code, name))
      `)
      .order('full_name');

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ── Create a new user account ──────────────────────────────
  // We use the Supabase Admin Auth API (service role) to create
  // the auth.users record. The handle_new_user() trigger then
  // automatically creates the profiles row.
  async createUser(dto: CreateUserDto) {
    const supabaseUrl = this.configService.get<string>('supabase.url')!;
    const serviceKey = this.configService.get<string>('supabase.serviceRoleKey')!;

    // Admin client — only used here for auth.admin operations
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // Skip email confirmation for internal users
      user_metadata: {
        full_name: dto.full_name,
      },
    });

    if (authError) throw new BadRequestException(authError.message);
    const newUserId = authData.user.id;

    // Update profile with department (the trigger creates the profile row)
    if (dto.department_id) {
      await this.db.client
        .from('profiles')
        .update({ department_id: dto.department_id })
        .eq('id', newUserId);
    }

    // Assign roles if provided
    if (dto.role_codes && dto.role_codes.length > 0) {
      const { data: roles } = await this.db.client
        .from('roles')
        .select('id, code')
        .in('code', dto.role_codes);

      if (roles && roles.length > 0) {
        const roleInserts = roles.map((role) => ({
          user_id: newUserId,
          role_id: role.id,
        }));
        await this.db.client.from('user_roles').insert(roleInserts);
      }
    }

    return { message: 'User created successfully', userId: newUserId };
  }

  // ── Update user's department ───────────────────────────────
  async updateUserDepartment(userId: string, departmentId: string | null) {
    const { data, error } = await this.db.client
      .from('profiles')
      .update({ department_id: departmentId })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  // ── Assign a role to a user ────────────────────────────────
  async assignRole(userId: string, roleId: string) {
    const { error } = await this.db.client
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId });

    if (error?.code === '23505') return { message: 'Role already assigned' };
    if (error) throw new BadRequestException(error.message);
    return { message: 'Role assigned' };
  }

  // ── Remove a role from a user ──────────────────────────────
  async removeRole(userId: string, roleId: string) {
    const { error } = await this.db.client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Role removed' };
  }

  // ── Get all POs (admin overview) ───────────────────────────
  async getAllPOs(status?: string, search?: string) {
    let query = this.db.client
      .from('purchase_orders')
      .select(`
        id, po_number, title, amount, category, status, current_stage,
        created_at, submitted_at, approved_at, completed_at,
        profiles!purchase_orders_created_by_fkey(full_name, email),
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) query = query.or(`title.ilike.%${search}%,po_number.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
