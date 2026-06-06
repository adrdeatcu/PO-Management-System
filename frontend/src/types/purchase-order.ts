export type POStatus =
  | 'draft'
  | 'submitted'
  | 'pending_manager'
  | 'pending_it'
  | 'pending_finance'
  | 'approved'
  | 'needs_rework'
  | 'completed';

export type POStage = 'none' | 'manager' | 'it' | 'finance' | 'completed';

export type POCategory =
  | 'IT Equipment'
  | 'Office Supplies'
  | 'Software & Licenses'
  | 'Travel & Accommodation'
  | 'Consulting & Services'
  | 'Marketing & Advertising'
  | 'Facilities & Maintenance'
  | 'Other';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  category: POCategory;
  created_by: string;
  department_id: string;
  manager_user_id: string | null;
  is_manager_approval_required: boolean;
  is_it_validation_required: boolean;
  status: POStatus;
  current_stage: POStage;
  version_no: number;
  resubmission_count: number;
  submitted_at: string | null;
  manager_approved_at: string | null;
  it_validated_at: string | null;
  finance_approved_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  last_rejected_at: string | null;
  last_rejection_reason: string | null;
  invoice_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface POWithActions extends PurchaseOrder {
  actions: POAction[];
}

export interface POAction {
  id: string;
  purchase_order_id: string;
  action_type: string;
  stage: POStage;
  from_status: POStatus | null;
  to_status: POStatus | null;
  acted_by: string;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}
