import { Reservation } from '../../../reservations/domain/entities/reservation.entity';
import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  InvalidPaymentAttemptError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import { FakePaymentGateway } from '../../infrastructure/gateways/fake-payment.gateway';
import { CreatePaymentUseCase } from './create-payment.use-case';

describe('CreatePaymentUseCase', () => {
  const memberId = '550e8400-e29b-41d4-a716-446655440003';
  const reservationId = '550e8400-e29b-41d4-a716-446655440001';
  let stored: PaymentAttempt | null;
  let useCase: CreatePaymentUseCase;
  let gateway: FakePaymentGateway;
  let reservations: { findById: jest.Mock; putOnPaymentHold: jest.Mock };

  beforeEach(() => {
    stored = null;
    gateway = new FakePaymentGateway();
    reservations = {
      findById: jest
        .fn()
        .mockResolvedValue(
          new Reservation({
            id: reservationId,
            deskId: 'desk-1',
            memberId,
            date: '2026-07-25',
            startTime: '09:00',
            endTime: '13:00',
            status: 'RESERVED',
          }),
        ),
      putOnPaymentHold: jest
        .fn()
        .mockImplementation(async () => reservations.findById()),
    };
    const payments = {
      findByIdempotencyKey: jest.fn(async () => stored),
      create: jest.fn(async (payment: PaymentAttempt) => (stored = payment)),
      saveCheckout: jest.fn(
        async (payment: PaymentAttempt) => (stored = payment),
      ),
    };
    useCase = new CreatePaymentUseCase(
      payments as never,
      reservations as never,
      gateway,
    );
  });

  it('calcula la seña en backend, crea hold y checkout sin aprobar la reserva', async () => {
    const result = await useCase.execute({
      reservationId,
      memberId,
      option: 'DEPOSIT',
      idempotencyKey: 'checkout-001',
    });
    expect(result.amountMinorUnits).toBe(180_000);
    expect(result.status).toBe('PENDING');
    expect(result.checkoutUrl).toContain(
      'https://fake-payments.test/checkout/',
    );
    expect(reservations.putOnPaymentHold).toHaveBeenCalledTimes(1);
  });

  it('calcula el pago total en backend', async () => {
    const result = await useCase.execute({
      reservationId,
      memberId,
      option: 'FULL',
      idempotencyKey: 'checkout-002',
    });
    expect(result.amountMinorUnits).toBe(600_000);
  });

  it('reutiliza el checkout con la misma clave y datos', async () => {
    const input = {
      reservationId,
      memberId,
      option: 'FULL' as const,
      idempotencyKey: 'checkout-003',
    };
    const first = await useCase.execute(input);
    const second = await useCase.execute(input);
    expect(second).toEqual(first);
    expect(gateway.createdPaymentCount).toBe(1);
  });

  it('rechaza una clave usada con otra opcion', async () => {
    await useCase.execute({
      reservationId,
      memberId,
      option: 'FULL',
      idempotencyKey: 'checkout-004',
    });
    await expect(
      useCase.execute({
        reservationId,
        memberId,
        option: 'DEPOSIT',
        idempotencyKey: 'checkout-004',
      }),
    ).rejects.toBeInstanceOf(PaymentIdempotencyConflictError);
  });

  it('rechaza una reserva ajena', async () => {
    await expect(
      useCase.execute({
        reservationId,
        memberId: 'otro-miembro',
        option: 'FULL',
        idempotencyKey: 'checkout-005',
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentAttemptError);
    expect(gateway.createdPaymentCount).toBe(0);
  });
});
