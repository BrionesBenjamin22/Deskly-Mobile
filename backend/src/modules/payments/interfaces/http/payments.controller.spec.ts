import { BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentIdempotencyConflictError } from '../../domain/errors/payment-domain.errors';
import { PaymentsController } from './payments.controller';

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
});
