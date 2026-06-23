import { Test, TestingModule } from '@nestjs/testing';
import { DeletePaymentUseCase } from './delete-payment.use-case';
import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';

describe('DeletePaymentUseCase', () => {
  let useCase: DeletePaymentUseCase;
  let paymentRepositoryMock: any;

  beforeEach(async () => {
    paymentRepositoryMock = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePaymentUseCase,
        {
          provide: PAYMENT_REPOSITORY,
          useValue: paymentRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<DeletePaymentUseCase>(DeletePaymentUseCase);
  });

  describe('execute', () => {
    it('should delete payment when found', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';
      const mockPayment = new Payment({
        id: paymentId,
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-06-22',
        amount: 100.5,
      });

      paymentRepositoryMock.findById.mockResolvedValue(mockPayment);
      paymentRepositoryMock.delete.mockResolvedValue(undefined);

      await useCase.execute(paymentId);

      expect(paymentRepositoryMock.findById).toHaveBeenCalledWith(paymentId);
      expect(paymentRepositoryMock.delete).toHaveBeenCalledWith(paymentId);
    });

    it('should throw PaymentNotFoundError when payment does not exist', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      paymentRepositoryMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(paymentId)).rejects.toThrow(
        PaymentNotFoundError,
      );
      expect(paymentRepositoryMock.delete).not.toHaveBeenCalled();
    });
  });
});
