import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const { data, error } = await this.db.client
      .from('departments')
      .select(`
        id,
        code,
        name,
        manager_user_id,
        created_at,
        updated_at
      `)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);

    // Fetch manager names separately to avoid the FK ambiguity
    const managerIds = (data ?? [])
      .map((d) => d.manager_user_id)
      .filter(Boolean) as string[];

    let managers: { id: string; full_name: string; email: string }[] = [];

    if (managerIds.length > 0) {
      const { data: profileData } = await this.db.client
        .from('profiles')
        .select('id, full_name, email')
        .in('id', managerIds);

      managers = profileData ?? [];
    }

    // Merge manager info into each department
    return (data ?? []).map((dept) => ({
      ...dept,
      manager: managers.find((m) => m.id === dept.manager_user_id) ?? null,
    }));
  }

  async findOne(id: string) {
    const { data, error } = await this.db.client
      .from('departments')
      .select('id, code, name, manager_user_id, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Department not found');
    return data;
  }

  async create(dto: CreateDepartmentDto) {
    const { data, error } = await this.db.client
      .from('departments')
      .insert({ name: dto.name, code: dto.code.toUpperCase() })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.code !== undefined) updates.code = dto.code.toUpperCase();
    if ('manager_user_id' in dto) updates.manager_user_id = dto.manager_user_id ?? null;

    const { data, error } = await this.db.client
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}