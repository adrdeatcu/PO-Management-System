import { Badge } from '../ui/Badge';
import type { POStatus } from '../../types/purchase-order';

const statusConfig: Record<POStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  draft:            { label: 'Draft',            variant: 'neutral'  },
  submitted:        { label: 'Submitted',         variant: 'info'     },
  pending_manager:  { label: 'Pending Manager',   variant: 'warning'  },
  pending_it:       { label: 'Pending IT',        variant: 'warning'  },
  pending_finance:  { label: 'Pending Finance',   variant: 'warning'  },
  approved:         { label: 'Approved',          variant: 'success'  },
  needs_rework:     { label: 'Needs Rework',      variant: 'error'    },
  completed:        { label: 'Completed',         variant: 'success'  },
};

export function POStatusBadge({ status }: { status: POStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
