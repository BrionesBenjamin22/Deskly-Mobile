import { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export type ListPaymentsParams = {
  page: number;
  limit: number;
  reservationId?: string;
};

export type ListPaymentsResult = {
  payments: Payment[];
  total: number;
};

export interface PaymentRepositoryPort {
  save(payment: Payment): Promise<Payment>;
  list(params: ListPaymentsParams): Promise<ListPaymentsResult>;
  findById(id: string): Promise<Payment | null>;
  findByReservationId(reservationId: string): Promise<Payment[]>;
  delete(id: string): Promise<void>;
}
