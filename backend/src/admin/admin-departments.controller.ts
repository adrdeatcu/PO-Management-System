import { Controller, Get, UseGuards } from '@nestjs/common';
import { DepartmentsService } from '../departments/departments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Thin controller — delegates to DepartmentsService.
// Admin-specific department operations (create/update) are on
// DepartmentsController with @Roles('admin') already applied.
@Controller('admin/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }
}
