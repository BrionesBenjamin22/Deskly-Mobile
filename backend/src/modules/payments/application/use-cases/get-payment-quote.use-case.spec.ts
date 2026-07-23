import { Reservation } from '../../../reservations/domain/entities/reservation.entity';
import { InvalidPaymentAttemptError } from '../../domain/errors/payment-domain.errors';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { GetPaymentQuoteUseCase } from './get-payment-quote.use-case';
import { PaymentAccessDeniedError } from './query-payment-attempts.use-cases';

describe('GetPaymentQuoteUseCase', () => {
  const reservationId = '550e8400-e29b-41d4-a716-446655440001';
  const memberId = '550e8400-e29b-41d4-a716-446655440002';
  const reservations = { findById: jest.fn() };
  const useCase = new GetPaymentQuoteUseCase(reservations as never);

  beforeEach(() => {
    jest.clearAllMocks();
    reservations.findById.mockResolvedValue(
      new Reservation({
        id: reservationId,
        deskId: 'desk-1',
        memberId,
        date: '2026-07-25',
        startTime: '09:00',
        endTime: '13:00',
        status: 'RESERVED',
      }),
    );
  });

  it('devuelve opciones ARS calculadas exclusivamente en backend', async () => {
    await expect(useCase.execute(reservationId, memberId)).resolves.toEqual({
      reservationId,
      currency: 'ARS',
      pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
      options: [
        { option: 'DEPOSIT', amountMinorUnits: 180_000 },
        { option: 'FULL', amountMinorUnits: 600_000 },
      ],
    });
  });

  it('rechaza reserva inexistente, ajena o no pagable', async () => {
    reservations.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute(reservationId, memberId),
    ).rejects.toBeInstanceOf(ReservationNotFoundError);

    reservations.findById.mockResolvedValueOnce(
      new Reservation({
        id: reservationId,
        deskId: 'desk-1',
        memberId: 'otro-miembro',
        date: '2026-07-25',
        startTime: '09:00',
        endTime: '13:00',
        status: 'RESERVED',
      }),
    );
    await expect(
      useCase.execute(reservationId, memberId),
    ).rejects.toBeInstanceOf(PaymentAccessDeniedError);
  });
});
