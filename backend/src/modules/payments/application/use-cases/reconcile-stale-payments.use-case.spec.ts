import { Logger } from '@nestjs/common';

import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import { PaymentGatewayError } from '../../domain/errors/payment-domain.errors';
import { DuplicateReservationApprovalError } from '../../domain/errors/payment-domain.errors';
import { ReconcileStalePaymentsUseCase } from './reconcile-stale-payments.use-case';

const now = new Date('2026-07-21T12:00:00.000Z');
const payment = (overrides: Record<string, unknown> = {}) =>
  new PaymentAttempt({
    id: 'payment-1',
    reservationId: 'reservation-1',
    memberId: 'member-1',
    amountMinorUnits: 45_000,
    currency: 'ARS',
    option: 'DEPOSIT',
    pricingVersion: 'v1',
    provider: 'FAKE',
    status: 'PENDING',
    idempotencyKey: 'reconcile-key',
    operationFingerprint: 'fingerprint',
    externalPaymentId: 'external-1',
    externalReference: 'reservation:reservation-1',
    expiresAt: new Date('2026-07-21T11:00:00.000Z'),
    updatedAt: new Date('2026-07-21T10:00:00.000Z'),
    version: 0,
    ...overrides,
  });

describe('ReconcileStalePaymentsUseCase', () => {
  const repository = {
    listStale: jest.fn(),
    saveStatus: jest.fn(),
  };
  const gateway = {
    provider: 'FAKE' as const,
    getPayment: jest.fn(),
    refundPayment: jest.fn(),
  };
  const useCase = new ReconcileStalePaymentsUseCase(
    repository as never,
    gateway as never,
    () => now,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.saveStatus.mockImplementation(async (item) => item);
    gateway.getPayment.mockResolvedValue({
      provider: 'FAKE',
      externalPaymentId: 'external-1',
      externalReference: 'reservation:reservation-1',
      status: 'APPROVED',
      amountMinorUnits: 45_000,
      currency: 'ARS',
      occurredAt: now,
    });
    gateway.refundPayment.mockResolvedValue({
      provider: 'FAKE',
      externalPaymentId: 'external-1',
      externalReference: 'reservation:reservation-1',
      status: 'REFUNDED',
      amountMinorUnits: 45_000,
      currency: 'ARS',
      occurredAt: now,
    });
  });

  it('consulta un lote acotado con antiguedad minima', async () => {
    repository.listStale.mockResolvedValue([]);

    await expect(
      useCase.execute({ limit: 20, minAgeMinutes: 10 }),
    ).resolves.toEqual({
      scanned: 0,
      updated: 0,
      expired: 0,
      retryableFailures: 0,
      inconsistencies: 0,
    });
    expect(repository.listStale).toHaveBeenCalledWith(
      'FAKE',
      ['PENDING', 'PROCESSING'],
      new Date('2026-07-21T11:50:00.000Z'),
      20,
    );
  });

  it('expira un intento vencido que nunca obtuvo checkout externo', async () => {
    repository.listStale.mockResolvedValue([
      payment({ externalPaymentId: null, checkoutUrl: null }),
    ]);

    await expect(useCase.execute()).resolves.toMatchObject({
      scanned: 1,
      updated: 1,
      expired: 1,
    });
    expect(gateway.getPayment).not.toHaveBeenCalled();
    expect(repository.saveStatus.mock.calls[0][0].status).toBe('EXPIRED');
  });

  it('aplica el estado autoritativo validando referencia, monto y moneda', async () => {
    repository.listStale.mockResolvedValue([payment()]);

    await expect(useCase.execute()).resolves.toMatchObject({
      scanned: 1,
      updated: 1,
    });
    expect(gateway.getPayment).toHaveBeenCalledWith('external-1', {
      externalReference: 'reservation:reservation-1',
      amountMinorUnits: 45_000,
      currency: 'ARS',
    });
    expect(repository.saveStatus.mock.calls[0][0].status).toBe('APPROVED');
  });

  it('aisla fallos reintentables y continua con el resto del lote', async () => {
    repository.listStale.mockResolvedValue([
      payment(),
      payment({ id: 'payment-2', externalPaymentId: 'external-2' }),
    ]);
    gateway.getPayment
      .mockRejectedValueOnce(
        new PaymentGatewayError('secret provider body', true),
      )
      .mockResolvedValueOnce({
        provider: 'FAKE',
        externalPaymentId: 'external-2',
        externalReference: 'reservation:reservation-1',
        status: 'REJECTED',
        amountMinorUnits: 45_000,
        currency: 'ARS',
        occurredAt: now,
      });
    const logger = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await expect(useCase.execute()).resolves.toMatchObject({
      scanned: 2,
      updated: 1,
      retryableFailures: 1,
    });
    expect(repository.saveStatus).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls.flat().join(' ')).not.toContain(
      'secret provider body',
    );
    logger.mockRestore();
  });

  it('reembolsa idempotentemente una segunda aprobacion detectada al conciliar', async () => {
    repository.listStale.mockResolvedValue([payment()]);
    repository.saveStatus
      .mockRejectedValueOnce(new DuplicateReservationApprovalError())
      .mockImplementationOnce(async (item) => item);

    await expect(useCase.execute()).resolves.toMatchObject({
      scanned: 1,
      updated: 1,
      inconsistencies: 0,
    });
    expect(gateway.refundPayment).toHaveBeenCalledWith(
      'external-1',
      'duplicate-approval:payment-1',
    );
    expect(repository.saveStatus.mock.calls[1][0].status).toBe('REFUNDED');
  });
});
