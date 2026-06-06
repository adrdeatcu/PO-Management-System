import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly db: DatabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.db.client
      .from('profiles')
      .select('id, full_name, email, department_id, departments(id, name, code)')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Profile not found');
    return data;
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
