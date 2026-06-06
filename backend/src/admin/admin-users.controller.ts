import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // All admin routes require admin role
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('users')
  findAllUsers(@Query('search') search?: string) {
    return this.adminUsersService.findAll(search);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Patch('users/:id/department')
  updateDepartment(
    @Param('id') id: string,
    @Body() body: { department_id: string | null },
  ) {
    return this.adminUsersService.updateUserDepartment(id, body.department_id);
  }

  @Post('users/:id/roles')
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.adminUsersService.assignRole(id, dto.role_id);
  }

  @Delete('users/:id/roles/:roleId')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.adminUsersService.removeRole(id, roleId);
  }

  @Get('purchase-orders')
  getAllPOs(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.getAllPOs(status, search);
  }
}
