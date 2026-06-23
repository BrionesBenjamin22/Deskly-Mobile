import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/list-payments.use-case';
import { GetPaymentByIdUseCase } from '../../application/use-cases/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/delete-payment.use-case';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let createPaymentUseCase: CreatePaymentUseCase;
  let listPaymentsUseCase: ListPaymentsUseCase;
  let getPaymentByIdUseCase: GetPaymentByIdUseCase;
  let deletePaymentUseCase: DeletePaymentUseCase;

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
    createPaymentUseCase = module.get<CreatePaymentUseCase>(
      CreatePaymentUseCase,
    );
    listPaymentsUseCase =
      module.get<ListPaymentsUseCase>(ListPaymentsUseCase);
    getPaymentByIdUseCase = module.get<GetPaymentByIdUseCase>(
      GetPaymentByIdUseCase,
    );
    deletePaymentUseCase =
      module.get<DeletePaymentUseCase>(DeletePaymentUseCase);
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

      jest.spyOn(createPaymentUseCase, 'execute').mockResolvedValue(expected);

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

      jest
        .spyOn(createPaymentUseCase, 'execute')
        .mockRejectedValue(new ReservationNotFoundError());

      expect(() => controller.create(body)).rejects.toThrow(
        NotFoundException,
      );
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

      jest.spyOn(listPaymentsUseCase, 'execute').mockResolvedValue(expected);

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

      jest
        .spyOn(getPaymentByIdUseCase, 'execute')
        .mockResolvedValue(expected);

      const result = await controller.findById(paymentId);

      expect(result).toEqual(expected);
      expect(getPaymentByIdUseCase.execute).toHaveBeenCalledWith(paymentId);
    });

    it('should handle PaymentNotFoundError', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      jest
        .spyOn(getPaymentByIdUseCase, 'execute')
        .mockRejectedValue(new PaymentNotFoundError());

      expect(() => controller.findById(paymentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete payment successfully', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(deletePaymentUseCase, 'execute').mockResolvedValue(undefined);

      await controller.delete(paymentId);

      expect(deletePaymentUseCase.execute).toHaveBeenCalledWith(paymentId);
    });

    it('should handle PaymentNotFoundError', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';

      jest
        .spyOn(deletePaymentUseCase, 'execute')
        .mockRejectedValue(new PaymentNotFoundError());

      expect(() => controller.delete(paymentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
