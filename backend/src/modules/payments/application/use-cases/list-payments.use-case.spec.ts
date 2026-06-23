import { Test, TestingModule } from '@nestjs/testing';
import { ListPaymentsUseCase } from './list-payments.use-case';
import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';

describe('ListPaymentsUseCase', () => {
  let useCase: ListPaymentsUseCase;
  let paymentRepositoryMock: any;

  beforeEach(async () => {
    paymentRepositoryMock = {
      list: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPaymentsUseCase,
        {
          provide: PAYMENT_REPOSITORY,
          useValue: paymentRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<ListPaymentsUseCase>(ListPaymentsUseCase);
  });

  describe('execute', () => {
    it('should return paginated payments', async () => {
      const mockPayments = [
        new Payment({
          id: '550e8400-e29b-41d4-a716-446655440000',
          reservationId: '550e8400-e29b-41d4-a716-446655440001',
          date: '2026-06-22',
          amount: 100.5,
          createdAt: new Date('2026-06-22'),
          updatedAt: new Date('2026-06-22'),
        }),
      ];

      paymentRepositoryMock.list.mockResolvedValue({
        payments: mockPayments,
        total: 1,
      });

      const result = await useCase.execute({
        page: 1,
        limit: 9,
      });

      expect(result).toEqual({
        payments: expect.arrayContaining([
          expect.objectContaining({
            paymentId: '550e8400-e29b-41d4-a716-446655440000',
            reservationId: '550e8400-e29b-41d4-a716-446655440001',
            date: '2026-06-22',
            amount: 100.5,
          }),
        ]),
        pagination: {
          page: 1,
          limit: 9,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should calculate totalPages correctly', async () => {
      const mockPayments = Array(15)
        .fill(null)
        .map(
          (_, i) =>
            new Payment({
              id: `id-${i}`,
              reservationId: `res-${i}`,
              date: '2026-06-22',
              amount: 100,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
        );

      paymentRepositoryMock.list.mockResolvedValue({
        payments: mockPayments.slice(0, 9),
        total: 15,
      });

      const result = await useCase.execute({
        page: 1,
        limit: 9,
      });

      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter by reservationId', async () => {
      const reservationId = '550e8400-e29b-41d4-a716-446655440001';
      const mockPayments = [];

      paymentRepositoryMock.list.mockResolvedValue({
        payments: mockPayments,
        total: 0,
      });

      await useCase.execute({
        page: 1,
        limit: 9,
        reservationId,
      });

      expect(paymentRepositoryMock.list).toHaveBeenCalledWith({
        page: 1,
        limit: 9,
        reservationId,
      });
    });
  });
});
