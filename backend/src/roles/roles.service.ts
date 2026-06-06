import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const { data, error } = await this.db.client
      .from('roles')
      .select('id, code, name')
      .order('name');

    if (error) throw new Error(error.message);
    return data;
  }

  async getRolesForUser(userId: string) {
    const { data, error } = await this.db.client
      .from('user_roles')
      .select('roles(id, code, name), assigned_at')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data;
  }

  async assignRole(userId: string, roleId: string) {
    const { data, error } = await this.db.client
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId })
      .select()
      .single();

    if (error?.code === '23505') return { message: 'Role already assigned' };
    if (error) throw new Error(error.message);
    return data;
  }

  async removeRole(userId: string, roleId: string) {
    const { error } = await this.db.client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw new Error(error.message);
    return { message: 'Role removed' };
  }
}
