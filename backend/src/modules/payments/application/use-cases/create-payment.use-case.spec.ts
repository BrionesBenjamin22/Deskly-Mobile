import { Reservation } from '../../../reservations/domain/entities/reservation.entity';
import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  InvalidPaymentAttemptError,
  PaymentGatewayError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import { FakePaymentGateway } from '../../infrastructure/gateways/fake-payment.gateway';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { CreatePaymentUseCase } from './create-payment.use-case';

describe('CreatePaymentUseCase', () => {
  const memberId = '550e8400-e29b-41d4-a716-446655440003';
  const reservationId = '550e8400-e29b-41d4-a716-446655440001';
  let stored: PaymentAttempt | null;
  let useCase: CreatePaymentUseCase;
  let gateway: FakePaymentGateway;
  let reservations: {
    findById: jest.Mock;
    putOnPaymentHold: jest.Mock;
    releasePaymentHold: jest.Mock;
  };

  beforeEach(() => {
    stored = null;
    gateway = new FakePaymentGateway();
    reservations = {
      findById: jest.fn().mockResolvedValue(
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
      releasePaymentHold: jest
        .fn()
        .mockImplementation(async () => reservations.findById()),
    };
    const payments = {
      findByIdempotencyKey: jest.fn(async () => stored),
      listByReservationId: jest.fn(async () => (stored ? [stored] : [])),
      createWithReservationHold: jest.fn(
        async (payment: PaymentAttempt) => (stored = payment),
      ),
      saveCheckout: jest.fn(
        async (payment: PaymentAttempt) => (stored = payment),
      ),
      saveStatus: jest.fn(
        async (payment: PaymentAttempt) => (stored = payment),
      ),
    };
    useCase = new CreatePaymentUseCase(
      payments as never,
      reservations as never,
      gateway,
    );
  });

  it('calcula la seña en backend y crea checkout sin aprobar la reserva', async () => {
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

  it('coordina solicitudes concurrentes con una sola creacion externa', async () => {
    const input = {
      reservationId,
      memberId,
      option: 'FULL' as const,
      idempotencyKey: 'checkout-concurrente',
    };
    const [first, second] = await Promise.all([
      useCase.execute(input),
      useCase.execute(input),
    ]);
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

  it('rechaza una reserva inexistente', async () => {
    reservations.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute({
        reservationId,
        memberId,
        option: 'FULL',
        idempotencyKey: 'checkout-inexistente',
      }),
    ).rejects.toBeInstanceOf(ReservationNotFoundError);
  });

  it('rechaza una reserva cancelada', async () => {
    reservations.findById.mockResolvedValueOnce(
      new Reservation({
        id: reservationId,
        deskId: 'desk-1',
        memberId,
        date: '2026-07-25',
        startTime: '09:00',
        endTime: '13:00',
        status: 'CANCELLED',
      }),
    );
    await expect(
      useCase.execute({
        reservationId,
        memberId,
        option: 'FULL',
        idempotencyKey: 'checkout-cancelada',
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentAttemptError);
  });

  it('rechaza una reserva con pago aprobado', async () => {
    await useCase.execute({
      reservationId,
      memberId,
      option: 'FULL',
      idempotencyKey: 'checkout-aprobado-original',
    });
    stored!.transitionTo('APPROVED', new Date());
    await expect(
      useCase.execute({
        reservationId,
        memberId,
        option: 'FULL',
        idempotencyKey: 'checkout-aprobado-nuevo',
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentAttemptError);
  });

  it('rechaza otro checkout mientras existe uno vigente', async () => {
    await useCase.execute({
      reservationId,
      memberId,
      option: 'DEPOSIT',
      idempotencyKey: 'checkout-vigente-original',
    });
    await expect(
      useCase.execute({
        reservationId,
        memberId,
        option: 'FULL',
        idempotencyKey: 'checkout-vigente-nuevo',
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentAttemptError);
  });

  it('libera el hold ante un fallo definitivo del gateway', async () => {
    jest
      .spyOn(gateway, 'createPayment')
      .mockRejectedValue(
        new PaymentGatewayError('fallo interno sensible', false),
      );
    await expect(
      useCase.execute({
        reservationId,
        memberId,
        option: 'FULL',
        idempotencyKey: 'checkout-fallo-definitivo',
      }),
    ).rejects.toBeInstanceOf(PaymentGatewayError);
    expect(stored?.status).toBe('REJECTED');
    expect(reservations.releasePaymentHold).toHaveBeenCalledWith(reservationId);
  });

  it('reutiliza el intento tras un timeout anterior a la creacion externa', async () => {
    jest
      .spyOn(gateway, 'createPayment')
      .mockRejectedValueOnce(new PaymentGatewayError('timeout', true));
    const input = {
      reservationId,
      memberId,
      option: 'FULL' as const,
      idempotencyKey: 'checkout-timeout-previo',
    };

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      PaymentGatewayError,
    );
    const recovered = await useCase.execute(input);

    expect(recovered.checkoutUrl).toContain('fake-payments.test/checkout');
    expect(gateway.createdPaymentCount).toBe(1);
    expect(reservations.releasePaymentHold).not.toHaveBeenCalled();
  });

  it('recupera el mismo checkout tras un timeout posterior a la creacion externa', async () => {
    const originalCreate = gateway.createPayment.bind(gateway);
    jest
      .spyOn(gateway, 'createPayment')
      .mockImplementationOnce(async (input) => {
        await originalCreate(input);
        throw new PaymentGatewayError('timeout posterior', true);
      });
    const input = {
      reservationId,
      memberId,
      option: 'DEPOSIT' as const,
      idempotencyKey: 'checkout-timeout-posterior',
    };

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      PaymentGatewayError,
    );
    const recovered = await useCase.execute(input);

    expect(recovered.checkoutUrl).toContain('fake-payment-1');
    expect(gateway.createdPaymentCount).toBe(1);
  });
});
