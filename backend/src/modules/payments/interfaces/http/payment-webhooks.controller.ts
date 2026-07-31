import {
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  Req,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

import { ProcessPaymentWebhookUseCase } from '../../application/use-cases/process-payment-webhook.use-case';
import {
  InvalidWebhookSignatureError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';

type RawWebhookRequest = Request & { rawBody?: Buffer };
const MAX_WEBHOOK_BODY_BYTES = 16 * 1024;

@ApiTags('Payment webhooks')
@Controller('webhooks/payments')
export class PaymentWebhooksController {
  constructor(private readonly processWebhook: ProcessPaymentWebhookUseCase) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async process(@Req() request: RawWebhookRequest) {
    const rawBody = request.rawBody?.toString('utf8') ?? '';
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES)
      throw new PayloadTooLargeException();

    const headers = Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [
        key.toLowerCase(),
        Array.isArray(value) ? value[0] : value,
      ]),
    );
    const query = Object.fromEntries(
      Object.entries(request.query).map(([key, value]) => [
        key,
        Array.isArray(value) ? String(value[0]) : String(value),
      ]),
    );
    try {
      return await this.processWebhook.execute({ rawBody, headers, query });
    } catch (error) {
      if (
        error instanceof InvalidWebhookSignatureError ||
        (error instanceof Error &&
          error.name === 'InvalidWebhookSignatureError')
      )
        throw new ForbiddenException({
          message: 'Notificacion no autorizada.',
        });
      if (
        error instanceof PaymentGatewayError ||
        (error instanceof Error && error.name === 'PaymentGatewayError')
      ) {
        if ((error as PaymentGatewayError).retryable)
          throw new ServiceUnavailableException({
            message: 'Notificacion temporalmente no procesable.',
          });
        throw new UnprocessableEntityException({
          message: 'Notificacion no procesable.',
        });
      }
      throw error;
    }
  }
}
