import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { GetPaymentQuoteUseCase } from './application/use-cases/get-payment-quote.use-case';
import { ListPaymentSummariesUseCase } from './application/use-cases/list-payment-summaries.use-case';
import { ProcessPaymentWebhookUseCase } from './application/use-cases/process-payment-webhook.use-case';
import { ReconcileStalePaymentsUseCase } from './application/use-cases/reconcile-stale-payments.use-case';
import {
  GetPaymentAttemptUseCase,
  ListReservationPaymentsUseCase,
  SynchronizePaymentAttemptUseCase,
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
import { PaymentQuotesController } from './interfaces/http/payment-quotes.controller';
import { PaymentSummariesController } from './interfaces/http/payment-summaries.controller';
import { PaymentReturnsController } from './interfaces/http/payment-returns.controller';

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [
    PaymentReturnsController,
    PaymentSummariesController,
    PaymentsController,
    ReservationPaymentsController,
    PaymentWebhooksController,
    PaymentOperationsController,
    PaymentQuotesController,
  ],
  providers: [
    CreatePaymentUseCase,
    GetPaymentQuoteUseCase,
    ProcessPaymentWebhookUseCase,
    ReconcileStalePaymentsUseCase,
    SynchronizePaymentAttemptUseCase,
    GetPaymentAttemptUseCase,
    ListReservationPaymentsUseCase,
    ListPaymentSummariesUseCase,
    ThrottlerGuard,
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
