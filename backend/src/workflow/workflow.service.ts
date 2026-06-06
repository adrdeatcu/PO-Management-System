import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { AuthUser } from '../common/types/user-context.type';
import { ApprovePoDto } from './dto/approve-po.dto';
import { RejectPoDto } from './dto/reject-po.dto';

// ── Workflow State Machine ────────────────────────────────────────────
//
// Valid transitions:
//
//   draft          --[submit]-→        pending_manager  (if manager required)
//   draft          --[submit]-→        pending_it       (if IT required, no manager)
//   draft          --[submit]-→        pending_finance  (if neither manager nor IT)
//
//   pending_manager --[approve]-→      pending_it       (if IT required)
//   pending_manager --[approve]-→      pending_finance  (always, after manager)
//   pending_manager --[reject]-→       needs_rework
//
//   pending_it      --[approve]-→      pending_finance
//   pending_it      --[reject]-→       needs_rework
//
//   pending_finance --[approve]-→      approved
//   pending_finance --[reject]-→       needs_rework
//
//   needs_rework    --[resubmit]-→     (same as fresh submit, restarts from beginning)
//
//   approved        --[complete]-→     completed
//
// ─────────────────────────────────────────────────────────────────────

@Injectable()
export class WorkflowService {
  constructor(
    private readonly db: DatabaseService,
    private readonly poService: PurchaseOrdersService,
  ) {}

  // ── SUBMIT ───────────────────────────────────────────────
  // Transitions: draft or needs_rework → first required stage
  // Resolves department manager at submission time (not at draft creation)
  async submit(poId: string, user: AuthUser) {
    const po = await this.poService.findOneOrFail(poId);

    if (po.created_by !== user.id) {
      throw new ForbiddenException('Only the creator can submit this PO');
    }
    if (!['draft', 'needs_rework'].includes(po.status)) {
      throw new BadRequestException(`Cannot submit a PO with status "${po.status}"`);
    }

    // ── Resolve creator's department and manager ──────────
    // Always look up fresh at submission time — manager may have changed since draft
    const { data: profile } = await this.db.client
      .from('profiles')
      .select('department_id')
      .eq('id', user.id)
      .single();

    if (!profile?.department_id) {
      throw new BadRequestException(
        'You must belong to a department before submitting a PO. Contact an admin.',
      );
    }

    const { data: department } = await this.db.client
      .from('departments')
      .select('id, manager_user_id')
      .eq('id', profile.department_id)
      .single();

    const resolvedManagerId: string | null = department?.manager_user_id ?? null;

    // Block submission if amount >= 100 but department has no manager
    if (po.amount >= 100 && !resolvedManagerId) {
      throw new BadRequestException(
        'Your department has no manager assigned. Contact an admin before submitting.',
      );
    }

    // ── Compute routing flags ─────────────────────────────
    const isManagerRequired = po.amount >= 100 && !!resolvedManagerId;
    const isItRequired = po.category === 'IT Equipment';

    // ── Determine first stage ─────────────────────────────
    let nextStatus: string;
    let nextStage: string;

    if (isManagerRequired) {
      nextStatus = 'pending_manager';
      nextStage = 'manager';
    } else if (isItRequired) {
      nextStatus = 'pending_it';
      nextStage = 'it';
    } else {
      nextStatus = 'pending_finance';
      nextStage = 'finance';
    }

    const isResubmission = po.status === 'needs_rework';
    const now = new Date().toISOString();

    // ── Update PO ─────────────────────────────────────────
    await this.db.client
      .from('purchase_orders')
      .update({
        status: nextStatus,
        current_stage: nextStage,
        is_manager_approval_required: isManagerRequired,
        is_it_validation_required: isItRequired,
        manager_user_id: resolvedManagerId,      // Snapshot manager at submission time
        department_id: profile.department_id,    // Ensure always current
        submitted_at: po.submitted_at ?? now,    // Preserve original submission time on resubmit
        resubmission_count: isResubmission
          ? po.resubmission_count + 1
          : po.resubmission_count,
        last_rejected_at: null,                  // Clear rejection info on resubmit
        last_rejection_reason: null,
      })
      .eq('id', poId);

    // ── Write audit action ────────────────────────────────
    await this.writeAuditAction({
      poId,
      actionType: isResubmission ? 'resubmitted' : 'submitted',
      stage: nextStage,
      fromStatus: po.status,
      toStatus: nextStatus,
      fromStage: po.current_stage,
      toStage: nextStage,
      actedBy: user.id,
      comment: null,
    });

    return { message: `PO submitted. Routing to ${nextStage} stage.` };
  }

  // ── APPROVE (Manager) ─────────────────────────────────────
  async approveAsManager(poId: string, dto: ApprovePoDto, user: AuthUser) {
    const po = await this.poService.findOneOrFail(poId);

    this.assertStage(po, 'pending_manager', 'manager');
    this.assertIsAssignedManager(po, user);

    // After manager: IT (if required) → Finance
    const nextStatus = po.is_it_validation_required ? 'pending_it' : 'pending_finance';
    const nextStage = po.is_it_validation_required ? 'it' : 'finance';

    await this.db.client
      .from('purchase_orders')
      .update({
        status: nextStatus,
        current_stage: nextStage,
        manager_approved_at: new Date().toISOString(),
      })
      .eq('id', poId);

    await this.writeAuditAction({
      poId,
      actionType: 'approved_manager',
      stage: 'manager',
      fromStatus: po.status,
      toStatus: nextStatus,
      fromStage: po.current_stage,
      toStage: nextStage,
      actedBy: user.id,
      comment: dto.comment ?? null,
    });

    return { message: `Manager approved. Routing to ${nextStage} stage.` };
  }

  // ── APPROVE (IT) ──────────────────────────────────────────
  async approveAsIT(poId: string, dto: ApprovePoDto, user: AuthUser) {
    const po = await this.poService.findOneOrFail(poId);

    this.assertStage(po, 'pending_it', 'it');
    this.assertHasRole(user, 'it');

    await this.db.client
      .from('purchase_orders')
      .update({
        status: 'pending_finance',
        current_stage: 'finance',
        it_validated_at: new Date().toISOString(),
      })
      .eq('id', poId);

    await this.writeAuditAction({
      poId,
      actionType: 'approved_it',
      stage: 'it',
      fromStatus: po.status,
      toStatus: 'pending_finance',
      fromStage: po.current_stage,
      toStage: 'finance',
      actedBy: user.id,
      comment: dto.comment ?? null,
    });

    return { message: 'IT validated. Routing to finance stage.' };
  }

  // ── APPROVE (Finance) ─────────────────────────────────────
  async approveAsFinance(poId: string, dto: ApprovePoDto, user: AuthUser) {
    const po = await this.poService.findOneOrFail(poId);

    this.assertStage(po, 'pending_finance', 'finance');
    this.assertHasRole(user, 'finance');

    const now = new Date().toISOString();

    await this.db.client
      .from('purchase_orders')
      .update({
        status: 'approved',
        current_stage: 'completed',
        finance_approved_at: now,
        approved_at: now,
      })
      .eq('id', poId);

    await this.writeAuditAction({
      poId,
      actionType: 'approved_finance',
      stage: 'finance',
      fromStatus: po.status,
      toStatus: 'approved',
      fromStage: po.current_stage,
      toStage: 'completed',
      actedBy: user.id,
      comment: dto.comment ?? null,
    });

    return { message: 'Finance approved. PO is fully approved.' };
  }

  // ── REJECT (any stage) ────────────────────────────────────
  async reject(poId: string, dto: RejectPoDto, user: AuthUser) {
    const po = await this.poService.findOneOrFail(poId);

    this.assertCanRejectAtStage(po, user);

    const now = new Date().toISOString();

    await this.db.client
      .from('purchase_orders')
      .update({
        status: 'needs_rework',
        current_stage: 'none',
        last_rejected_at: now,
        last_rejection_reason: dto.reason,
      })
      .eq('id', poId);

    await this.writeAuditAction({
      poId,
      actionType: 'rejected',
      stage: po.current_stage,
      fromStatus: po.status,
      toStatus: 'needs_rework',
      fromStage: po.current_stage,
      toStage: 'none',
      actedBy: user.id,
      comment: dto.reason,
    });

    return { message: 'PO rejected and returned to creator for rework.' };
  }

  // ── COMPLETE (mark as invoiced) ───────────────────────────
  async complete(poId: string, invoiceReference: string, user: AuthUser) {
    const po = await this.poService.findOneOrFail(poId);

    if (po.status !== 'approved') {
      throw new BadRequestException('Only fully approved POs can be marked as completed');
    }
    if (!user.roles.includes('finance') && !user.roles.includes('admin')) {
      throw new ForbiddenException('Only finance or admin can mark a PO as completed');
    }

    const now = new Date().toISOString();

    await this.db.client
      .from('purchase_orders')
      .update({
        status: 'completed',
        current_stage: 'completed',
        completed_at: now,
        invoice_reference: invoiceReference,
      })
      .eq('id', poId);

    await this.writeAuditAction({
      poId,
      actionType: 'completed',
      stage: 'completed',
      fromStatus: po.status,
      toStatus: 'completed',
      fromStage: po.current_stage,
      toStage: 'completed',
      actedBy: user.id,
      comment: `Invoice: ${invoiceReference}`,
    });

    return { message: 'PO marked as completed.' };
  }

  // ── APPROVAL INBOX ────────────────────────────────────────
  // Returns POs waiting for action from this specific user.
  // Uses separate queries per role to avoid complex OR string parsing issues.
  async getInbox(user: AuthUser) {
    const results: any[] = [];

    // Manager: only POs explicitly assigned to this user
    if (user.roles.includes('manager')) {
      const { data } = await this.db.client
        .from('purchase_orders')
        .select('id, po_number, title, amount, category, status, current_stage, submitted_at, department_id')
        .eq('status', 'pending_manager')
        .eq('manager_user_id', user.id)
        .order('submitted_at', { ascending: true });

      if (data) results.push(...data);
    }

    // IT: all POs at IT stage (any IT user can act)
    if (user.roles.includes('it')) {
      const { data } = await this.db.client
        .from('purchase_orders')
        .select('id, po_number, title, amount, category, status, current_stage, submitted_at, department_id')
        .eq('status', 'pending_it')
        .order('submitted_at', { ascending: true });

      if (data) results.push(...data);
    }

    // Finance: all POs at finance stage (any finance user can act)
    if (user.roles.includes('finance')) {
      const { data } = await this.db.client
        .from('purchase_orders')
        .select('id, po_number, title, amount, category, status, current_stage, submitted_at, department_id')
        .eq('status', 'pending_finance')
        .order('submitted_at', { ascending: true });

      if (data) results.push(...data);
    }

    // Deduplicate by id (handles users with multiple roles, e.g. manager + finance)
    const seen = new Set<string>();
    return results.filter((po) => {
      if (seen.has(po.id)) return false;
      seen.add(po.id);
      return true;
    });
  }

  // ── Private helpers ───────────────────────────────────────

  private assertStage(po: any, expectedStatus: string, expectedStage: string) {
    if (po.status !== expectedStatus || po.current_stage !== expectedStage) {
      throw new BadRequestException(
        `This action is not valid for a PO in status "${po.status}" at stage "${po.current_stage}"`,
      );
    }
  }

  private assertHasRole(user: AuthUser, role: string) {
    if (!user.roles.includes(role)) {
      throw new ForbiddenException(`You need the "${role}" role to perform this action`);
    }
  }

  private assertIsAssignedManager(po: any, user: AuthUser) {
    if (!user.roles.includes('manager')) {
      throw new ForbiddenException('You need the "manager" role to approve this PO');
    }
    if (po.manager_user_id !== user.id) {
      throw new ForbiddenException('You are not the assigned manager for this PO');
    }
  }

  private assertCanRejectAtStage(po: any, user: AuthUser) {
    const stage = po.current_stage;
    if (stage === 'manager') this.assertIsAssignedManager(po, user);
    else if (stage === 'it') this.assertHasRole(user, 'it');
    else if (stage === 'finance') this.assertHasRole(user, 'finance');
    else throw new BadRequestException(`PO at stage "${stage}" cannot be rejected`);
  }

  private async writeAuditAction(params: {
    poId: string;
    actionType: string;
    stage: string;
    fromStatus: string;
    toStatus: string;
    fromStage: string;
    toStage: string;
    actedBy: string;
    comment: string | null;
  }) {
    await this.db.client.from('po_approval_actions').insert({
      purchase_order_id: params.poId,
      action_type: params.actionType,
      stage: params.stage,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      from_stage: params.fromStage,
      to_stage: params.toStage,
      acted_by: params.actedBy,
      comment: params.comment,
    });
  }
}