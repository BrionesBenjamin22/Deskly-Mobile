import { Prisma } from '@prisma/client';

import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  ConcurrentPaymentUpdateError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import { PrismaPaymentAttemptRepository } from './prisma-payment-attempt.repository';

const persistedPayment = (overrides: Record<string, unknown> = {}) => ({
  id: '59167e9c-50fe-4265-b7de-0410325f3059',
  reservationId: 'reservation-1',
  memberId: 'member-1',
  date: new Date('2026-07-18T00:00:00.000Z'),
  amountMinorUnits: 45_000n,
  currency: 'ARS' as const,
  option: 'DEPOSIT' as const,
  pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
  provider: 'FAKE' as const,
  status: 'PENDING' as const,
  idempotencyKey: 'idem-1',
  operationFingerprint: 'fingerprint-1',
  externalPaymentId: 'external-1',
  externalReference: 'reservation:reservation-1',
  checkoutUrl: 'https://checkout.invalid/payment-1',
  failureReason: null,
  expiresAt: new Date('2026-07-18T12:15:00.000Z'),
  approvedAt: null,
  cancelledAt: null,
  refundedAt: null,
  version: 0,
  createdAt: new Date('2026-07-18T12:00:00.000Z'),
  updatedAt: new Date('2026-07-18T12:00:00.000Z'),
  ...overrides,
});

const attempt = (overrides: Record<string, unknown> = {}) =>
  new PaymentAttempt({
    id: '59167e9c-50fe-4265-b7de-0410325f3059',
    reservationId: 'reservation-1',
    memberId: 'member-1',
    amountMinorUnits: 45_000,
    currency: 'ARS',
    option: 'DEPOSIT',
    pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
    provider: 'FAKE',
    status: 'PENDING',
    idempotencyKey: 'idem-1',
    operationFingerprint: 'fingerprint-1',
    externalPaymentId: 'external-1',
    externalReference: 'reservation:reservation-1',
    checkoutUrl: 'https://checkout.invalid/payment-1',
    expiresAt: new Date('2026-07-18T12:15:00.000Z'),
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
    updatedAt: new Date('2026-07-18T12:00:00.000Z'),
    version: 0,
    ...overrides,
  });

describe('PrismaPaymentAttemptRepository', () => {
  const payment = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
  const paymentEvent = { findUnique: jest.fn() };
  const transactionPayment = {
    create: jest.fn(),
    updateMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const transactionPaymentEvent = { create: jest.fn() };
  const transactionReservation = {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const prisma = {
    payment,
    paymentEvent,
    $transaction: jest.fn((callback: (transaction: unknown) => unknown) =>
      callback({
        payment: transactionPayment,
        paymentEvent: transactionPaymentEvent,
        reservation: transactionReservation,
      }),
    ),
  };
  const repository = new PrismaPaymentAttemptRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    transactionReservation.findUnique.mockResolvedValue({
      status: 'PENDING_PAYMENT',
    });
    transactionReservation.update.mockResolvedValue({});
    transactionReservation.updateMany.mockResolvedValue({ count: 1 });
  });

  it('persiste dinero como bigint y devuelve el intento creado', async () => {
    payment.create.mockResolvedValue(persistedPayment());

    const result = await repository.create(attempt());

    expect(payment.create).toHaveBeenCalledTimes(1);
    const createCalls = payment.create.mock.calls as unknown as Array<
      [unknown]
    >;
    const createInput = createCalls[0]?.[0];
    expect(createInput).toMatchObject({
      data: { amountMinorUnits: 45_000n },
    });
    expect(result.amount.minorUnits).toBe(45_000);
    expect(result.amount.currency).toBe('ARS');
  });

  it('crea el intento y el hold de reserva en una unica transaccion', async () => {
    transactionPayment.create.mockResolvedValue(persistedPayment());
    transactionReservation.updateMany.mockResolvedValue({ count: 1 });

    const result = await repository.createWithReservationHold(attempt());

    expect(transactionPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountMinorUnits: 45_000n }),
      }),
    );
    expect(transactionReservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: {
        holdExpiresAt: new Date('2026-07-18T12:15:00.000Z'),
      },
    });
    expect(result.id).toBe(attempt().id);
  });

  it('devuelve la operacion original ante una clave repetida compatible', async () => {
    payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: '7.8.0',
      }),
    );
    payment.findUnique.mockResolvedValue(persistedPayment());

    await expect(repository.create(attempt())).resolves.toMatchObject({
      operationFingerprint: 'fingerprint-1',
    });
  });

  it('rechaza una clave repetida con datos incompatibles', async () => {
    payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: '7.8.0',
      }),
    );
    payment.findUnique.mockResolvedValue(
      persistedPayment({ operationFingerprint: 'otro-fingerprint' }),
    );

    await expect(repository.create(attempt())).rejects.toBeInstanceOf(
      PaymentIdempotencyConflictError,
    );
  });

  it('actualiza estado y evento dentro de la misma transaccion', async () => {
    transactionPayment.updateMany.mockResolvedValue({ count: 1 });
    transactionPaymentEvent.create.mockResolvedValue({});
    transactionPayment.findUniqueOrThrow.mockResolvedValue(
      persistedPayment({ status: 'APPROVED', version: 1 }),
    );
    const changed = attempt();
    changed.transitionTo('APPROVED', new Date('2026-07-18T12:01:00.000Z'));

    const result = await repository.saveStatus(changed, {
      eventId: '81e9a2de-ed90-4ea9-a65d-f4046af37918',
      paymentId: changed.id!,
      provider: 'FAKE',
      externalEventId: 'event-1',
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      occurredAt: new Date('2026-07-18T12:01:00.000Z'),
      processedAt: new Date('2026-07-18T12:01:01.000Z'),
    });

    expect(transactionPayment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: changed.id, version: 0 } }),
    );
    expect(transactionPaymentEvent.create).toHaveBeenCalledTimes(1);
    expect(transactionReservation.updateMany).toHaveBeenCalledWith({
      where: { id: 'reservation-1', status: 'PENDING_PAYMENT' },
      data: { status: 'RESERVED', holdExpiresAt: null },
    });
    expect(result.status).toBe('APPROVED');
    expect(result.version).toBe(1);
  });

  it('detecta una actualizacion concurrente mediante version optimista', async () => {
    transactionPayment.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.saveStatus(attempt())).rejects.toBeInstanceOf(
      ConcurrentPaymentUpdateError,
    );
    expect(transactionPaymentEvent.create).not.toHaveBeenCalled();
  });

  it('consulta duplicados de eventos dentro del proveedor', async () => {
    paymentEvent.findUnique.mockResolvedValue({ id: 'event-id' });

    await expect(
      repository.externalEventExists('FAKE', 'event-1'),
    ).resolves.toBe(true);
    expect(paymentEvent.findUnique).toHaveBeenCalledWith({
      where: {
        provider_externalEventId: {
          provider: 'FAKE',
          externalEventId: 'event-1',
        },
      },
      select: { id: true },
    });
  });

  it('lista pendientes envejecidos con orden y limite deterministas', async () => {
    payment.findMany.mockResolvedValue([persistedPayment()]);
    const before = new Date('2026-07-18T12:30:00.000Z');

    await expect(
      repository.listStale('FAKE', ['PENDING', 'PROCESSING'], before, 25),
    ).resolves.toHaveLength(1);
    expect(payment.findMany).toHaveBeenCalledWith({
      where: {
        provider: 'FAKE',
        status: { in: ['PENDING', 'PROCESSING'] },
        updatedAt: { lte: before },
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: 25,
    });
  });

  it('pagina resumenes exclusivamente por miembro y estados pagables', async () => {
    const reservation = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'reservation-1',
          date: new Date('2026-08-01T00:00:00.000Z'),
          startTime: new Date('1970-01-01T09:00:00.000Z'),
          endTime: new Date('1970-01-01T13:00:00.000Z'),
          desk: { code: 'D-1', name: 'Escritorio 1' },
          payments: [persistedPayment()],
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    };
    const scopedPrisma = { reservation };
    const scopedRepository = new PrismaPaymentAttemptRepository(
      scopedPrisma as never,
    );

    await expect(
      scopedRepository.listPaymentSummaryCandidates('member-1'),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'reservation-1',
        deskName: 'Escritorio 1',
        date: '2026-08-01',
        startTime: '09:00',
        endTime: '13:00',
        attempts: [expect.any(PaymentAttempt)],
      }),
    ]);
    expect(reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          memberId: 'member-1',
          status: { in: ['PENDING_PAYMENT', 'RESERVED', 'ACTIVE'] },
        },
      }),
    );
  });
});
