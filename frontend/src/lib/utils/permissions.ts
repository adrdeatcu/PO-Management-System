import type { AuthUser } from '../../types/auth';
import type { PurchaseOrder } from '../../types/purchase-order';

export function canEditPO(po: PurchaseOrder, user: AuthUser): boolean {
  return (
    po.created_by === user.id &&
    (po.status === 'draft' || po.status === 'needs_rework')
  );
}

export function canSubmitPO(po: PurchaseOrder, user: AuthUser): boolean {
  return (
    po.created_by === user.id &&
    (po.status === 'draft' || po.status === 'needs_rework')
  );
}

export function canApproveAsManager(po: PurchaseOrder, user: AuthUser): boolean {
  return (
    po.status === 'pending_manager' &&
    po.manager_user_id === user.id &&
    user.roles.includes('manager')
  );
}

export function canApproveAsIT(po: PurchaseOrder, user: AuthUser): boolean {
  return po.status === 'pending_it' && user.roles.includes('it');
}

export function canApproveAsFinance(po: PurchaseOrder, user: AuthUser): boolean {
  return po.status === 'pending_finance' && user.roles.includes('finance');
}

export function canReject(po: PurchaseOrder, user: AuthUser): boolean {
  return (
    canApproveAsManager(po, user) ||
    canApproveAsIT(po, user) ||
    canApproveAsFinance(po, user)
  );
}

export function canComplete(po: PurchaseOrder, user: AuthUser): boolean {
  return (
    po.status === 'approved' &&
    (user.roles.includes('finance') || user.roles.includes('admin'))
  );
}

export function isAdmin(user: AuthUser): boolean {
  return user.roles.includes('admin');
}
