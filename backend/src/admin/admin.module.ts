import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminDepartmentsController } from './admin-departments.controller';
import { DatabaseModule } from '../database/database.module';
import { DepartmentsModule } from '../departments/departments.module';
import { AdminRolesController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';

@Module({
  imports: [DatabaseModule, DepartmentsModule],
  controllers: [
    AdminUsersController,
    AdminDepartmentsController,
    AdminRolesController,
  ],
  providers: [
    AdminUsersService,
    AdminRolesService,
  ],
})
export class AdminModule {}