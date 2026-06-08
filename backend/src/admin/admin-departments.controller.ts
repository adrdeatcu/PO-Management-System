import {
  Controller, Get, Post, Patch,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from '../departments/departments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';
import { AdminUsersService } from './admin-users.service';
import { SetDepartmentManagerDto } from './dto/set-department-manager.dto';

@Controller('admin/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  // NEW: set department manager (and ensure user has manager role)
  @Post('set-manager')
  async setManager(@Body() dto: SetDepartmentManagerDto) {
    return this.adminUsersService.setDepartmentManager(dto.user_id, dto.department_id);
  }
}