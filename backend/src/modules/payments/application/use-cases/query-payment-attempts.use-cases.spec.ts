import { Reservation } from '../../../reservations/domain/entities/reservation.entity';
import {
  PaymentAttempt,
  PaymentProvider,
} from '../../domain/entities/payment-attempt.entity';
import {
  GetPaymentAttemptUseCase,
  ListReservationPaymentsUseCase,
  PaymentAccessDeniedError,
  SynchronizePaymentAttemptUseCase,
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
  const synchronizer = {
    execute: jest.fn((item: PaymentAttempt) => Promise.resolve(item)),
  };

  it('permite al miembro consultar su pago', async () => {
    const useCase = new GetPaymentAttemptUseCase(
      payments as never,
      synchronizer as never,
    );
    await expect(
      useCase.execute(payment.id!, { role: 'MIEMBRO', memberId: 'member-1' }),
    ).resolves.toMatchObject({ paymentId: payment.id, memberId: 'member-1' });
  });

  it('impide al miembro consultar pagos ajenos', async () => {
    synchronizer.execute.mockClear();
    const useCase = new GetPaymentAttemptUseCase(
      payments as never,
      synchronizer as never,
    );
    await expect(
      useCase.execute(payment.id!, { role: 'MIEMBRO', memberId: 'member-2' }),
    ).rejects.toBeInstanceOf(PaymentAccessDeniedError);
    expect(synchronizer.execute).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'GESTOR'] as const)(
    'permite al rol %s consultar pagos operativos',
    async (role) => {
      const useCase = new GetPaymentAttemptUseCase(
        payments as never,
        synchronizer as never,
      );
      await expect(
        useCase.execute(payment.id!, { role }),
      ).resolves.toMatchObject({ paymentId: payment.id });
    },
  );

  it('autoriza el listado por la propiedad de la reserva antes de consultar pagos', async () => {
    const useCase = new ListReservationPaymentsUseCase(
      payments as never,
      reservations as never,
      synchronizer as never,
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

describe('sincronizacion consultiva de pagos', () => {
  const pendingPayment = () =>
    new PaymentAttempt({
      id: '550e8400-e29b-41d4-a716-446655440020',
      reservationId: '550e8400-e29b-41d4-a716-446655440001',
      memberId: 'member-1',
      amountMinorUnits: 600_000,
      currency: 'ARS',
      option: 'FULL',
      pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
      provider: 'MERCADO_PAGO',
      status: 'PENDING',
      idempotencyKey: 'checkout-002',
      operationFingerprint: 'fingerprint-2',
      externalReference: 'payment:550e8400-e29b-41d4-a716-446655440020',
      expiresAt: new Date('2026-08-01T15:15:00.000Z'),
    });

  it('vincula y aprueba por referencia cuando se perdio el webhook', async () => {
    const repository = {
      bindExternalPaymentId: jest.fn(
        (
          _id: string,
          _provider: PaymentProvider,
          externalPaymentId: string,
        ) => {
          const local = pendingPayment();
          local.attachCheckout({
            externalPaymentId,
            checkoutUrl: 'https://sandbox.mercadopago.com/checkout',
          });
          return Promise.resolve(local);
        },
      ),
      saveStatus: jest.fn((item: PaymentAttempt) => Promise.resolve(item)),
    };
    const gateway = {
      provider: 'MERCADO_PAGO',
      findPaymentByExternalReference: jest.fn().mockResolvedValue({
        provider: 'MERCADO_PAGO',
        externalPaymentId: '123456',
        externalReference: 'payment:550e8400-e29b-41d4-a716-446655440020',
        status: 'APPROVED',
        amountMinorUnits: 600_000,
        currency: 'ARS',
        occurredAt: new Date('2026-07-24T12:00:00.000Z'),
      }),
    };

    const result = await new SynchronizePaymentAttemptUseCase(
      repository as never,
      gateway as never,
    ).execute(pendingPayment());

    expect(repository.bindExternalPaymentId).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440020',
      'MERCADO_PAGO',
      '123456',
    );
    expect(repository.saveStatus.mock.calls[0][0].status).toBe('APPROVED');
    expect(result.status).toBe('APPROVED');
  });

  it('mantiene pendiente el intento si el proveedor aun no informa un pago', async () => {
    const repository = {
      bindExternalPaymentId: jest.fn(),
      saveStatus: jest.fn(),
    };
    const gateway = {
      provider: 'MERCADO_PAGO',
      findPaymentByExternalReference: jest.fn().mockResolvedValue(null),
    };
    const local = pendingPayment();

    await expect(
      new SynchronizePaymentAttemptUseCase(
        repository as never,
        gateway as never,
      ).execute(local),
    ).resolves.toBe(local);
    expect(repository.saveStatus).not.toHaveBeenCalled();
  });
});
