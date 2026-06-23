export type PaymentOutput = {
  paymentId: string;
  reservationId: string;
  date: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ListPaymentsOutput = {
  payments: PaymentOutput[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
