import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../common/types/user-context.type';
import { CreatePoDto } from './dto/create-po.dto';
import { UpdatePoDto } from './dto/update-po.dto';
import { QueryPoDto } from './dto/query-po.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly db: DatabaseService) {}

  // ── Create a new PO in draft state ─────────────────────
  async create(dto: CreatePoDto, user: AuthUser) {
    if (!user.departmentId) {
      throw new BadRequestException('You must belong to a department before creating a PO');
    }

    const { data: dept } = await this.db.client
      .from('departments')
      .select('manager_user_id')
      .eq('id', user.departmentId)
      .single();

    const { data: poNumResult } = await this.db.client
      .rpc('generate_po_number');

    const newPo = {
      po_number: poNumResult,
      title: dto.title,
      description: dto.description ?? null,
      amount: dto.amount,
      currency: 'USD',
      category: dto.category,
      created_by: user.id,
      department_id: user.departmentId,
      manager_user_id: dept?.manager_user_id ?? null,
      status: 'draft',
      current_stage: 'none',
    };

    const { data, error } = await this.db.client
      .from('purchase_orders')
      .insert(newPo)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ── Update a PO (only allowed in draft or needs_rework) ─
  async update(id: string, dto: UpdatePoDto, user: AuthUser) {
    const po = await this.findOneOrFail(id);

    if (po.created_by !== user.id) {
      throw new ForbiddenException('You can only edit your own purchase orders');
    }
    if (!['draft', 'needs_rework'].includes(po.status)) {
      throw new BadRequestException(
        `Cannot edit a PO with status "${po.status}". Only draft or needs_rework POs can be edited.`,
      );
    }

    const { data, error } = await this.db.client
      .from('purchase_orders')
      .update({ ...dto, version_no: po.version_no + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ── Get a single PO with its audit actions ──────────────
  async findOne(id: string, user: AuthUser) {
    const po = await this.findOneOrFail(id);

    // Access check: creator, assigned manager, IT, Finance, or Admin
    const canView =
      po.created_by === user.id ||
      po.manager_user_id === user.id ||
      user.roles.includes('it') ||
      user.roles.includes('finance') ||
      user.roles.includes('admin');

    if (!canView) {
      throw new ForbiddenException('You do not have access to this purchase order');
    }

    // Fetch audit trail — no FK join to avoid PostgREST ambiguity
    const { data: actions } = await this.db.client
      .from('po_approval_actions')
      .select('id, action_type, stage, from_status, to_status, from_stage, to_stage, acted_by, comment, created_at')
      .eq('purchase_order_id', id)
      .order('created_at', { ascending: true });

    // Fetch actor names separately
    const actorIds = [
      ...new Set((actions ?? []).map((a) => a.acted_by).filter(Boolean)),
    ];

    let actorMap: Record<string, { full_name: string; email: string }> = {};

    if (actorIds.length > 0) {
      const { data: actors } = await this.db.client
        .from('profiles')
        .select('id, full_name, email')
        .in('id', actorIds);

      actorMap = Object.fromEntries((actors ?? []).map((p) => [p.id, p]));
    }

    const enrichedActions = (actions ?? []).map((action) => ({
      ...action,
      actor: actorMap[action.acted_by] ?? null,
    }));

    return { ...po, actions: enrichedActions };
  }

  // ── My POs (creator view) ───────────────────────────────
  async findMyPOs(user: AuthUser, query: QueryPoDto) {
    let q = this.db.client
      .from('purchase_orders')
      .select('id, po_number, title, amount, category, status, current_stage, created_at, updated_at, submitted_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (query.status) q = q.eq('status', query.status);
    if (query.search) q = q.or(`title.ilike.%${query.search}%,po_number.ilike.%${query.search}%`);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    q = q.range((page - 1) * limit, page * limit - 1);

    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ── Dashboard stats for the current user ───────────────
  async getDashboardStats(user: AuthUser) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Run all queries in parallel
    const [
      { count: draftCount },
      { count: needsReworkCount },
      { count: pendingApprovalCount },
      { count: completedThisMonthCount },
      { count: totalMyPOs },
    ] = await Promise.all([
      this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'draft'),

      this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'needs_rework'),

      this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('status', ['pending_manager', 'pending_it', 'pending_finance']),

      this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth),

      this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id),
    ]);

    // Inbox count — POs waiting for THIS user's action as approver
    let inboxCount = 0;

    if (user.roles.includes('manager')) {
      const { count } = await this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_manager')
        .eq('manager_user_id', user.id);
      inboxCount += count ?? 0;
    }

    if (user.roles.includes('it')) {
      const { count } = await this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_it');
      inboxCount += count ?? 0;
    }

    if (user.roles.includes('finance')) {
      const { count } = await this.db.client
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_finance');
      inboxCount += count ?? 0;
    }

    return {
      my_draft: draftCount ?? 0,
      my_needs_rework: needsReworkCount ?? 0,
      my_pending_approval: pendingApprovalCount ?? 0,
      my_completed_this_month: completedThisMonthCount ?? 0,
      my_total: totalMyPOs ?? 0,
      inbox_pending: inboxCount,
    };
  }

  // ── Internal helper ─────────────────────────────────────
  async findOneOrFail(id: string) {
    const { data, error } = await this.db.client
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Purchase order ${id} not found`);
    return data;
  }
}