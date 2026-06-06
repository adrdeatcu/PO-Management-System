import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PurchaseOrdersService],
  controllers: [PurchaseOrdersController],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
