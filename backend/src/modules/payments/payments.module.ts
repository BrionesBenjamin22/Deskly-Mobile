import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { ProcessPaymentWebhookUseCase } from './application/use-cases/process-payment-webhook.use-case';
import { ReconcileStalePaymentsUseCase } from './application/use-cases/reconcile-stale-payments.use-case';
import {
  GetPaymentAttemptUseCase,
  ListReservationPaymentsUseCase,
} from './application/use-cases/query-payment-attempts.use-cases';
import { PAYMENT_ATTEMPT_REPOSITORY } from './domain/ports/payment-attempt-repository.port';
import { PAYMENT_GATEWAY } from './domain/ports/payment-gateway.port';
import { FakePaymentGateway } from './infrastructure/gateways/fake-payment.gateway';
import { MercadoPagoGateway } from './infrastructure/gateways/mercado-pago.gateway';
import {
  readMercadoPagoConfig,
  readPaymentGatewayName,
} from './infrastructure/gateways/mercado-pago.config';
import { PrismaPaymentAttemptRepository } from './infrastructure/persistence/prisma-payment-attempt.repository';
import {
  PaymentsController,
  ReservationPaymentsController,
} from './interfaces/http/payments.controller';
import { PaymentWebhooksController } from './interfaces/http/payment-webhooks.controller';
import { PaymentOperationsController } from './interfaces/http/payment-operations.controller';

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [
    PaymentsController,
    ReservationPaymentsController,
    PaymentWebhooksController,
    PaymentOperationsController,
  ],
  providers: [
    CreatePaymentUseCase,
    ProcessPaymentWebhookUseCase,
    ReconcileStalePaymentsUseCase,
    GetPaymentAttemptUseCase,
    ListReservationPaymentsUseCase,
    {
      provide: PAYMENT_ATTEMPT_REPOSITORY,
      useClass: PrismaPaymentAttemptRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useFactory: () =>
        readPaymentGatewayName() === 'MERCADO_PAGO'
          ? new MercadoPagoGateway(readMercadoPagoConfig())
          : new FakePaymentGateway(),
    },
  ],
})
export class PaymentsModule {}
