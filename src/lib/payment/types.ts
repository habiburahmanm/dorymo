export type BangladeshGateway = 'bkash' | 'nagad' | 'sslcommerz' | 'rocket';

export interface PaymentInitiationRequest {
  orderId: string;
  gateway: BangladeshGateway;
  amount: number;
  laborSubtotal: number;
  equipmentSubtotal: number;
  escrowDeposit: number;
  platformFee: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  callbackUrl?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  gateway: BangladeshGateway;
  paymentId: string;
  redirectUrl?: string;
  transactionStatus: 'Initiated' | 'Pending' | 'Completed' | 'Failed';
  errorMessage?: string;
}

export interface PaymentExecutionResult {
  success: boolean;
  gateway: BangladeshGateway;
  paymentId: string;
  trxId: string;
  amount: number;
  customerPhone?: string;
  paidAt: string;
  escrowHeld: number;
  statusCode: string;
  statusMessage: string;
}

export interface EscrowRefundRequest {
  bookingId: string;
  paymentId: string;
  originalTrxId: string;
  depositAmount: number;
  recipientPhone: string;
  reason: string;
}

export interface EscrowRefundResponse {
  success: boolean;
  refundTrxId: string;
  refundedAmount: number;
  refundedAt: string;
  remainingHeldAmount: number;
  message: string;
}
