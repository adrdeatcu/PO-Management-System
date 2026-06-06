import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { AuthModule } from '../auth/auth.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [AuthModule, PurchaseOrdersModule],
  providers: [WorkflowService],
  controllers: [WorkflowController],
})
export class WorkflowModule {}
