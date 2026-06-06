import { Controller, Post, Param, Body, Get, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { WorkflowService } from './workflow.service';
import { ApprovePoDto } from './dto/approve-po.dto';
import { RejectPoDto } from './dto/reject-po.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/user-context.type';

class CompletePoDto {
  @IsString()
  @IsNotEmpty()
  invoice_reference!: string;
}

@Controller('workflow')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('inbox')
  getInbox(@CurrentUser() user: AuthUser) {
    return this.workflowService.getInbox(user);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflowService.submit(id, user);
  }

  @Post(':id/approve/manager')
  approveAsManager(
    @Param('id') id: string,
    @Body() dto: ApprovePoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.approveAsManager(id, dto, user);
  }

  @Post(':id/approve/it')
  approveAsIT(
    @Param('id') id: string,
    @Body() dto: ApprovePoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.approveAsIT(id, dto, user);
  }

  @Post(':id/approve/finance')
  approveAsFinance(
    @Param('id') id: string,
    @Body() dto: ApprovePoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.approveAsFinance(id, dto, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectPoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.reject(id, dto, user);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() dto: CompletePoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.complete(id, dto.invoice_reference, user);
  }
}
