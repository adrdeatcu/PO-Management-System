import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePoDto } from './dto/create-po.dto';
import { UpdatePoDto } from './dto/update-po.dto';
import { QueryPoDto } from './dto/query-po.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/user-context.type';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  // ── MUST be before /:id — otherwise "stats" is parsed as a UUID ──
  @Get('stats')
  getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.poService.getDashboardStats(user);
  }

  @Get()
  findMyPOs(@CurrentUser() user: AuthUser, @Query() query: QueryPoDto) {
    return this.poService.findMyPOs(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.poService.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreatePoDto, @CurrentUser() user: AuthUser) {
    return this.poService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.poService.update(id, dto, user);
  }

  // ── AI summary endpoint ──────────────────────────────────
  @Post(':id/summarize-feedback')
  summarizeFeedback(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.poService.summarizeFeedback(id, user);
  }
}