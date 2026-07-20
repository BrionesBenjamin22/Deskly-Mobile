import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { PAYMENT_ATTEMPT_REPOSITORY } from './domain/ports/payment-attempt-repository.port';
import { PAYMENT_GATEWAY } from './domain/ports/payment-gateway.port';
import { FakePaymentGateway } from './infrastructure/gateways/fake-payment.gateway';
import { PrismaPaymentAttemptRepository } from './infrastructure/persistence/prisma-payment-attempt.repository';
import { PaymentsController } from './interfaces/http/payments.controller';

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [PaymentsController],
  providers: [
    CreatePaymentUseCase,
    {
      provide: PAYMENT_ATTEMPT_REPOSITORY,
      useClass: PrismaPaymentAttemptRepository,
    },
    { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
  ],
})
export class PaymentsModule {}
