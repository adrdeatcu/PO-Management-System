export interface ApprovePayload {
  comment?: string;
}

export interface RejectPayload {
  reason: string;
}

export interface CompletePayload {
  invoice_reference: string;
}
