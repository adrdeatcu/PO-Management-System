import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminRolesService {
  constructor(private readonly db: DatabaseService) {}

  // List all roles (employee, manager, it, finance, admin)
  async findAll() {
    const { data, error } = await this.db.client
      .from('roles')
      .select('id, code, name')
      .order('code', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }
}