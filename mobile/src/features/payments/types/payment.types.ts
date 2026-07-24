export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export type PaymentOption = "DEPOSIT" | "FULL";

export type PaymentQuote = {
  reservationId: string;
  currency: "ARS";
  pricingVersion: string;
  totalMinorUnits: number;
  approvedMinorUnits: number;
  pendingMinorUnits: number;
  options: Array<{
    option: PaymentOption;
    amountMinorUnits: number;
  }>;
};

export type PaymentAttempt = {
  paymentId: string;
  reservationId: string;
  amountMinorUnits: number;
  currency: "ARS";
  option: PaymentOption;
  pricingVersion: string;
  status: PaymentStatus;
  checkoutUrl: string | null;
  expiresAt: string;
  createdAt?: string;
};

export type PaymentCheckout = PaymentAttempt & {
  checkoutUrl: string;
};

export type PaymentReservationItem = {
  reservationId: string;
  deskName: string;
  dateLabel: string;
  totalMinorUnits: number;
  approvedMinorUnits: number;
  pendingMinorUnits: number;
  attempts: PaymentAttempt[];
};
