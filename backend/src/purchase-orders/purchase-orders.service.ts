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

    // Fetch the department to snapshot the manager
    const { data: dept } = await this.db.client
      .from('departments')
      .select('manager_user_id')
      .eq('id', user.departmentId)
      .single();

    // Generate the PO number via the SQL function
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

    // Ownership / access check:
    // Creator can always view their own. Approvers can view if it's their stage.
    // Admin sees everything (enforced in admin controller separately).
    const isCreator = po.created_by === user.id;
    const isManager = po.manager_user_id === user.id;
    const isIT = user.roles.includes('it');
    const isFinance = user.roles.includes('finance');

    if (!isCreator && !isManager && !isIT && !isFinance) {
      throw new ForbiddenException('You do not have access to this purchase order');
    }

    // Fetch audit trail
    const { data: actions } = await this.db.client
      .from('po_approval_actions')
      .select('*, profiles!po_approval_actions_acted_by_fkey(full_name, email)')
      .eq('purchase_order_id', id)
      .order('created_at', { ascending: true });

    return { ...po, actions: actions ?? [] };
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
