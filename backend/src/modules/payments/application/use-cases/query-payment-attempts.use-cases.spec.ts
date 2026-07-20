import { Reservation } from '../../../reservations/domain/entities/reservation.entity';
import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  GetPaymentAttemptUseCase,
  ListReservationPaymentsUseCase,
  PaymentAccessDeniedError,
} from './query-payment-attempts.use-cases';

const payment = new PaymentAttempt({
  id: '550e8400-e29b-41d4-a716-446655440010',
  reservationId: '550e8400-e29b-41d4-a716-446655440001',
  memberId: 'member-1',
  amountMinorUnits: 600_000,
  currency: 'ARS',
  option: 'FULL',
  pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
  provider: 'FAKE',
  status: 'PENDING',
  idempotencyKey: 'checkout-001',
  operationFingerprint: 'fingerprint',
  externalReference: 'reservation:1',
  expiresAt: new Date('2026-07-20T15:15:00.000Z'),
});

describe('consultas autorizadas de pagos', () => {
  const payments = {
    findById: jest.fn().mockResolvedValue(payment),
    listByReservationId: jest.fn().mockResolvedValue([payment]),
  };
  const reservations = {
    findById: jest.fn().mockResolvedValue(
      new Reservation({
        id: payment.reservationId,
        deskId: 'desk-1',
        memberId: 'member-1',
        date: '2026-07-25',
        startTime: '09:00',
        endTime: '13:00',
        status: 'PENDING_PAYMENT',
      }),
    ),
  };

  it('permite al miembro consultar su pago', async () => {
    const useCase = new GetPaymentAttemptUseCase(payments as never);
    await expect(
      useCase.execute(payment.id!, { role: 'MIEMBRO', memberId: 'member-1' }),
    ).resolves.toMatchObject({ paymentId: payment.id, memberId: 'member-1' });
  });

  it('impide al miembro consultar pagos ajenos', async () => {
    const useCase = new GetPaymentAttemptUseCase(payments as never);
    await expect(
      useCase.execute(payment.id!, { role: 'MIEMBRO', memberId: 'member-2' }),
    ).rejects.toBeInstanceOf(PaymentAccessDeniedError);
  });

  it.each(['ADMIN', 'GESTOR'] as const)(
    'permite al rol %s consultar pagos operativos',
    async (role) => {
      const useCase = new GetPaymentAttemptUseCase(payments as never);
      await expect(
        useCase.execute(payment.id!, { role }),
      ).resolves.toMatchObject({ paymentId: payment.id });
    },
  );

  it('autoriza el listado por la propiedad de la reserva antes de consultar pagos', async () => {
    const useCase = new ListReservationPaymentsUseCase(
      payments as never,
      reservations as never,
    );
    await expect(
      useCase.execute(payment.reservationId, {
        role: 'MIEMBRO',
        memberId: 'member-1',
      }),
    ).resolves.toHaveLength(1);
    expect(payments.listByReservationId).toHaveBeenCalledWith(
      payment.reservationId,
    );
  });
});
