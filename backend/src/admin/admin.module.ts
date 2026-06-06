import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminDepartmentsController } from './admin-departments.controller';
import { AuthModule } from '../auth/auth.module';
import { DepartmentsModule } from '../departments/departments.module';

@Module({
  imports: [AuthModule, DepartmentsModule],
  providers: [AdminUsersService],
  controllers: [AdminUsersController, AdminDepartmentsController],
})
export class AdminModule {}
