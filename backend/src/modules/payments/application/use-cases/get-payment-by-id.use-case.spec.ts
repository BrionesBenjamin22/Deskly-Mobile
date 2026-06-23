import { Test, TestingModule } from '@nestjs/testing';
import { GetPaymentByIdUseCase } from './get-payment-by-id.use-case';
import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';

describe('GetPaymentByIdUseCase', () => {
  let useCase: GetPaymentByIdUseCase;
  let paymentRepositoryMock: any;

  beforeEach(async () => {
    paymentRepositoryMock = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentByIdUseCase,
        {
          provide: PAYMENT_REPOSITORY,
          useValue: paymentRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<GetPaymentByIdUseCase>(GetPaymentByIdUseCase);
  });

  describe('execute', () => {
    it('should return payment when found', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';
      const mockPayment = new Payment({
        id: paymentId,
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-06-22',
        amount: 100.5,
        createdAt: new Date('2026-06-22'),
        updatedAt: new Date('2026-06-22'),
      });

      paymentRepositoryMock.findById.mockResolvedValue(mockPayment);

      const result = await useCase.execute(paymentId);

      expect(result).toEqual({
        paymentId,
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-06-22',
        amount: 100.5,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(paymentRepositoryMock.findById).toHaveBeenCalledWith(paymentId);
    });

    it('should throw PaymentNotFoundError when payment does not exist', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      paymentRepositoryMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(paymentId)).rejects.toThrow(
        PaymentNotFoundError,
      );
    });
  });
});
