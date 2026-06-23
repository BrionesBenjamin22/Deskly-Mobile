import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentUseCase } from './create-payment.use-case';
import {
  PAYMENT_REPOSITORY,
  PaymentRepositoryPort,
} from '../../domain/ports/payment-repository.port';
import {
  RESERVATION_REPOSITORY,
  ReservationRepositoryPort,
} from '../../../reservations/domain/ports/reservation-repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { Reservation } from '../../../reservations/domain/entities/reservation.entity';

type PaymentRepositoryMock = jest.Mocked<Pick<PaymentRepositoryPort, 'save'>>;
type ReservationRepositoryMock = jest.Mocked<
  Pick<ReservationRepositoryPort, 'findById'>
>;

describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase;
  let paymentRepositoryMock: PaymentRepositoryMock;
  let reservationRepositoryMock: ReservationRepositoryMock;

  beforeEach(async () => {
    paymentRepositoryMock = {
      save: jest.fn(),
    };

    reservationRepositoryMock = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentUseCase,
        {
          provide: PAYMENT_REPOSITORY,
          useValue: paymentRepositoryMock,
        },
        {
          provide: RESERVATION_REPOSITORY,
          useValue: reservationRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
  });

  describe('execute', () => {
    it('should create a payment when reservation exists', async () => {
      const reservationId = '550e8400-e29b-41d4-a716-446655440001';
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';
      const mockReservation = createReservation(reservationId);
      const mockPayment = new Payment({
        id: paymentId,
        reservationId,
        date: '2026-06-22',
        amount: 100.5,
      });

      reservationRepositoryMock.findById.mockResolvedValue(mockReservation);
      paymentRepositoryMock.save.mockResolvedValue(mockPayment);

      const result = await useCase.execute({
        reservationId,
        date: '2026-06-22',
        amount: 100.5,
      });

      expect(result).toEqual({
        paymentId,
        reservationId,
        date: '2026-06-22',
        amount: 100.5,
      });
      expect(reservationRepositoryMock.findById).toHaveBeenCalledWith(
        reservationId,
      );
      expect(paymentRepositoryMock.save).toHaveBeenCalled();
    });

    it('should throw ReservationNotFoundError when reservation does not exist', async () => {
      const reservationId = '550e8400-e29b-41d4-a716-446655440001';

      reservationRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          reservationId,
          date: '2026-06-22',
          amount: 100.5,
        }),
      ).rejects.toThrow(ReservationNotFoundError);
    });

    it('should throw error if payment is not persisted correctly', async () => {
      const reservationId = '550e8400-e29b-41d4-a716-446655440001';
      const mockReservation = createReservation(reservationId);
      const mockPayment = new Payment({
        reservationId,
        date: '2026-06-22',
        amount: 100.5,
      });

      reservationRepositoryMock.findById.mockResolvedValue(mockReservation);
      paymentRepositoryMock.save.mockResolvedValue(mockPayment);

      await expect(
        useCase.execute({
          reservationId,
          date: '2026-06-22',
          amount: 100.5,
        }),
      ).rejects.toThrow('Payment was not persisted correctly.');
    });
  });
});

function createReservation(id: string): Reservation {
  return new Reservation({
    id,
    deskId: '550e8400-e29b-41d4-a716-446655440002',
    memberId: '550e8400-e29b-41d4-a716-446655440003',
    date: '2026-06-25',
    startTime: '09:00',
    endTime: '13:00',
    status: 'ACTIVE',
  });
}
