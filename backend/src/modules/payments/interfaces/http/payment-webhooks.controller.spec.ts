import {
  ForbiddenException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import {
  InvalidWebhookSignatureError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';
import { PaymentWebhooksController } from './payment-webhooks.controller';

describe('PaymentWebhooksController', () => {
  const useCase = { execute: jest.fn() };
  const controller = new PaymentWebhooksController(useCase as never);
  const request = (rawBody = '{}', headers: Record<string, string> = {}) => ({
    rawBody: Buffer.from(rawBody),
    headers,
  });

  beforeEach(() => jest.clearAllMocks());

  it('entrega el body crudo y headers normalizados al caso de uso', async () => {
    useCase.execute.mockResolvedValue({
      accepted: true,
      duplicate: false,
      applied: true,
    });
    await expect(
      controller.process(
        request('{"id":1}', { 'X-Signature': 'firma' }) as never,
      ),
    ).resolves.toMatchObject({ accepted: true });
    expect(useCase.execute).toHaveBeenCalledWith({
      rawBody: '{"id":1}',
      headers: { 'x-signature': 'firma' },
    });
  });

  it('rechaza cuerpos mayores a 16 KiB', async () => {
    await expect(
      controller.process(request('x'.repeat(16 * 1024 + 1)) as never),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('responde sin detalles internos ante firma invalida', async () => {
    useCase.execute.mockRejectedValue(new InvalidWebhookSignatureError());
    await expect(controller.process(request() as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each([
    [true, ServiceUnavailableException],
    [false, UnprocessableEntityException],
  ])('mapea fallo de proveedor retryable=%s', async (retryable, expected) => {
    useCase.execute.mockRejectedValue(
      new PaymentGatewayError('secreto interno', retryable),
    );
    await expect(controller.process(request() as never)).rejects.toBeInstanceOf(
      expected,
    );
  });

  it('admite hasta 120 notificaciones por minuto e IP', () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        PaymentWebhooksController.prototype.process,
      ),
    ).toBe(120);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        PaymentWebhooksController.prototype.process,
      ),
    ).toBe(60_000);
  });
});
