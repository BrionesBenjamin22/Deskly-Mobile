import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
} from '@nestjs/common';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { PaymentIdempotencyConflictError } from '../../domain/errors/payment-domain.errors';
import {
  paymentUserTracker,
  PaymentsController,
  ReservationPaymentsController,
} from './payments.controller';

describe('PaymentsController', () => {
  const request = { user: { member: { id: 'member-1' } } } as never;
  const output = {
    paymentId: 'payment-1',
    checkoutUrl: 'https://fake-payments.test/checkout/payment-1',
  };
  let execute: jest.Mock;
  let controller: PaymentsController;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue(output);
    controller = new PaymentsController(
      { execute } as never,
      { execute: jest.fn() } as never,
    );
  });

  it('propaga miembro autenticado y clave de idempotencia', async () => {
    await expect(
      controller.checkout(
        {
          reservationId: '550e8400-e29b-41d4-a716-446655440001',
          option: 'FULL',
        },
        'checkout-001',
        request,
      ),
    ).resolves.toEqual(output);
    expect(execute).toHaveBeenCalledWith({
      reservationId: '550e8400-e29b-41d4-a716-446655440001',
      option: 'FULL',
      memberId: 'member-1',
      idempotencyKey: 'checkout-001',
    });
  });

  it('rechaza claves ausentes o invalidas', async () => {
    await expect(
      controller.checkout(
        {
          reservationId: '550e8400-e29b-41d4-a716-446655440001',
          option: 'FULL',
        },
        undefined,
        request,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(execute).not.toHaveBeenCalled();
  });

  it('traduce conflictos de idempotencia sin filtrar detalles internos', async () => {
    execute.mockRejectedValue(new PaymentIdempotencyConflictError());
    await expect(
      controller.checkout(
        {
          reservationId: '550e8400-e29b-41d4-a716-446655440001',
          option: 'FULL',
        },
        'checkout-002',
        request,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('limita checkout a 5 solicitudes por minuto', () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        PaymentsController.prototype.checkout,
      ),
    ).toBe(5);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        PaymentsController.prototype.checkout,
      ),
    ).toBe(60_000);
  });

  it('limita las consultas que sincronizan pagos a 30 por minuto', () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        PaymentsController.prototype.findById,
      ),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        ReservationPaymentsController.prototype.listByReservation,
      ),
    ).toBe(30);
  });

  it('aísla el contador por usuario autenticado', () => {
    const context = {} as ExecutionContext;
    expect(
      paymentUserTracker(
        { user: { id: 'user-1' }, ip: '192.168.1.10' },
        context,
      ),
    ).toBe('user:user-1');
    expect(paymentUserTracker({ ip: '192.168.1.10' }, context)).toBe(
      'ip:192.168.1.10',
    );
  });
});
