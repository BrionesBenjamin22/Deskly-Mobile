import { Module } from '@nestjs/common';

import { ReservationsModule } from '../reservations/reservations.module';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { DeletePaymentUseCase } from './application/use-cases/delete-payment.use-case';
import { GetPaymentByIdUseCase } from './application/use-cases/get-payment-by-id.use-case';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';
import { PAYMENT_REPOSITORY } from './domain/ports/payment-repository.port';
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { PaymentsController } from './interfaces/http/payments.controller';

@Module({
  imports: [ReservationsModule],
  controllers: [PaymentsController],
  providers: [
    CreatePaymentUseCase,
    ListPaymentsUseCase,
    GetPaymentByIdUseCase,
    DeletePaymentUseCase,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
  ],
})
export class PaymentsModule {}
