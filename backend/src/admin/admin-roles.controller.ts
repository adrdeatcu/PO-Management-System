import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesService } from './admin-roles.service';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get()
  findAll() {
    return this.adminRolesService.findAll();
  }
}