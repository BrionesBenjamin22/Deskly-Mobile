import { Inject, Injectable } from '@nestjs/common';

import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentOutputMapper } from '../mappers/payment-output.mapper';
import type { ListPaymentsOutput } from '../dto/list-payments.output';

export type ListPaymentsInput = {
  page: number;
  limit: number;
  reservationId?: string;
};

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(input: ListPaymentsInput): Promise<ListPaymentsOutput> {
    const { payments, total } = await this.paymentRepository.list({
      page: input.page,
      limit: input.limit,
      reservationId: input.reservationId,
    });

    const totalPages = Math.ceil(total / input.limit);

    return {
      payments: payments.map(PaymentOutputMapper.toPaymentOutput),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages,
      },
    };
  }
}
