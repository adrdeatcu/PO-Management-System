import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/user-context.type';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('users')
  getUsers(@Query('search') search?: string) {
    return this.adminUsersService.getAllUsers(search);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Patch('users/:id/department')
  updateDepartment(
    @Param('id') userId: string,
    @Body('department_id') departmentId: string | null,
  ) {
    return this.adminUsersService.updateDepartment(userId, departmentId);
  }

  @Post('users/:id/roles')
  assignRole(
    @Param('id') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.adminUsersService.assignRole(userId, dto.role_id);
  }

  @Delete('users/:id/roles/:roleId')
  removeRole(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.adminUsersService.removeRole(userId, roleId);
  }

  @Get('purchase-orders')
  getAllPOs(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.getAllPOs(status, search);
  }
}