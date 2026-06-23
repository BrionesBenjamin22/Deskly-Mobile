import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/list-payments.use-case';
import { GetPaymentByIdUseCase } from '../../application/use-cases/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/delete-payment.use-case';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let createPaymentUseCase: jest.Mocked<Pick<CreatePaymentUseCase, 'execute'>>;
  let listPaymentsUseCase: jest.Mocked<Pick<ListPaymentsUseCase, 'execute'>>;
  let getPaymentByIdUseCase: jest.Mocked<
    Pick<GetPaymentByIdUseCase, 'execute'>
  >;
  let deletePaymentUseCase: jest.Mocked<Pick<DeletePaymentUseCase, 'execute'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: CreatePaymentUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ListPaymentsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetPaymentByIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeletePaymentUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    createPaymentUseCase =
      module.get<typeof createPaymentUseCase>(CreatePaymentUseCase);
    listPaymentsUseCase =
      module.get<typeof listPaymentsUseCase>(ListPaymentsUseCase);
    getPaymentByIdUseCase = module.get<typeof getPaymentByIdUseCase>(
      GetPaymentByIdUseCase,
    );
    deletePaymentUseCase =
      module.get<typeof deletePaymentUseCase>(DeletePaymentUseCase);
  });

  describe('create', () => {
    it('should create a payment successfully', async () => {
      const body = {
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-06-22',
        amount: 100.5,
      };

      const expected = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        ...body,
      };

      createPaymentUseCase.execute.mockResolvedValue(expected);

      const result = await controller.create(body);

      expect(result).toEqual(expected);
      expect(createPaymentUseCase.execute).toHaveBeenCalledWith(body);
    });

    it('should handle ReservationNotFoundError', async () => {
      const body = {
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-06-22',
        amount: 100.5,
      };

      createPaymentUseCase.execute.mockRejectedValue(
        new ReservationNotFoundError(),
      );

      await expect(controller.create(body)).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated payments', async () => {
      const query = {
        page: 1,
        limit: 9,
      };

      const expected = {
        payments: [
          {
            paymentId: '550e8400-e29b-41d4-a716-446655440000',
            reservationId: '550e8400-e29b-41d4-a716-446655440001',
            date: '2026-06-22',
            amount: 100.5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 9,
          total: 1,
          totalPages: 1,
        },
      };

      listPaymentsUseCase.execute.mockResolvedValue(expected);

      const result = await controller.list(query);

      expect(result).toEqual(expected);
      expect(listPaymentsUseCase.execute).toHaveBeenCalledWith(query);
    });
  });

  describe('findById', () => {
    it('should return payment details', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';
      const expected = {
        paymentId,
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-06-22',
        amount: 100.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getPaymentByIdUseCase.execute.mockResolvedValue(expected);

      const result = await controller.findById(paymentId);

      expect(result).toEqual(expected);
      expect(getPaymentByIdUseCase.execute).toHaveBeenCalledWith(paymentId);
    });

    it('should handle PaymentNotFoundError', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      getPaymentByIdUseCase.execute.mockRejectedValue(
        new PaymentNotFoundError(),
      );

      await expect(controller.findById(paymentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete payment successfully', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      deletePaymentUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(paymentId);

      expect(deletePaymentUseCase.execute).toHaveBeenCalledWith(paymentId);
    });

    it('should handle PaymentNotFoundError', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      deletePaymentUseCase.execute.mockRejectedValue(
        new PaymentNotFoundError(),
      );

      await expect(controller.delete(paymentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
