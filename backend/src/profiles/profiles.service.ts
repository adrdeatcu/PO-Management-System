import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly db: DatabaseService) {}

  async getProfile(userId: string) {
    // Query 1: profile + department
    const { data: profile, error: profileError } = await this.db.client
      .from('profiles')
      .select('id, full_name, email, department_id, departments(id, name, code)')
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new NotFoundException('Profile not found');

    // Query 2: roles via user_roles join
    const { data: userRoles } = await this.db.client
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', userId);

    return {
      ...profile,
      user_roles: userRoles ?? [],
    };
  }

  async updateProfile(userId: string, updates: { full_name?: string }) {
    const { data, error } = await this.db.client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new NotFoundException('Could not update profile');
    return data;
  }
}