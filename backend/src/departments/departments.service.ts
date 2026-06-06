import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const { data, error } = await this.db.client
      .from('departments')
      .select('id, code, name, manager_user_id, profiles!departments_manager_user_id_fkey(full_name, email)')
      .order('name');

    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.db.client
      .from('departments')
      .select('id, code, name, manager_user_id, profiles!departments_manager_user_id_fkey(full_name, email)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Department not found');
    return data;
  }

  async create(dto: CreateDepartmentDto) {
    const { data, error } = await this.db.client
      .from('departments')
      .insert(dto)
      .select()
      .single();

    if (error?.code === '23505') throw new ConflictException('Department code already exists');
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const { data, error } = await this.db.client
      .from('departments')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Department not found');
    return data;
  }
}
