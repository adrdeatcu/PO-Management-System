import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { DepartmentsModule } from './departments/departments.module';
import { RolesModule } from './roles/roles.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // ConfigModule is global — every other module can inject ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    ProfilesModule,
    DepartmentsModule,
    RolesModule,
    PurchaseOrdersModule,
    WorkflowModule,
    AdminModule,
  ],
})
export class AppModule {}
