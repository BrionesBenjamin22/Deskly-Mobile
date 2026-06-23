import { Inject, Injectable } from '@nestjs/common';

import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { PaymentOutputMapper } from '../mappers/payment-output.mapper';
import type { PaymentDetailOutput } from '../dto/payment.output';

@Injectable()
export class GetPaymentByIdUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(id: string): Promise<PaymentDetailOutput> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    return PaymentOutputMapper.toPaymentDetailOutput(payment);
  }
}
