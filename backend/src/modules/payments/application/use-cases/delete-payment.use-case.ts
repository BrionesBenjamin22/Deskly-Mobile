import { Inject, Injectable } from '@nestjs/common';

import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';

@Injectable()
export class DeletePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    await this.paymentRepository.delete(id);
  }
}
