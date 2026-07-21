import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  DuplicateReservationApprovalError,
  DuplicatePaymentEventError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';
import { ProcessPaymentWebhookUseCase } from './process-payment-webhook.use-case';

const at = new Date('2026-07-21T12:00:00.000Z');
const payment = (status: 'PENDING' | 'PROCESSING' | 'APPROVED' = 'PENDING') =>
  new PaymentAttempt({
    id: 'payment-1',
    reservationId: 'reservation-1',
    memberId: 'member-1',
    amountMinorUnits: 45000,
    currency: 'ARS',
    option: 'DEPOSIT',
    pricingVersion: 'v1',
    provider: 'FAKE',
    status,
    idempotencyKey: 'key',
    operationFingerprint: 'fingerprint',
    externalPaymentId: 'external-1',
    externalReference: 'reservation:reservation-1',
    expiresAt: new Date('2026-07-21T13:00:00.000Z'),
    version: 0,
  });

describe('ProcessPaymentWebhookUseCase', () => {
  const gateway = {
    provider: 'FAKE' as const,
    verifyAndParseWebhook: jest.fn(),
    getPayment: jest.fn(),
    refundPayment: jest.fn(),
  };
  const repository = {
    externalEventExists: jest.fn(),
    findByExternalPaymentId: jest.fn(),
    saveStatus: jest.fn(),
  };
  const useCase = new ProcessPaymentWebhookUseCase(
    gateway as never,
    repository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.verifyAndParseWebhook.mockResolvedValue({
      eventId: 'event-1',
      externalPaymentId: 'external-1',
      eventType: 'payment',
    });
    repository.externalEventExists.mockResolvedValue(false);
    repository.findByExternalPaymentId.mockResolvedValue(payment());
    gateway.getPayment.mockResolvedValue({
      provider: 'FAKE',
      externalPaymentId: 'external-1',
      externalReference: 'reservation:reservation-1',
      status: 'APPROVED',
      amountMinorUnits: 45000,
      currency: 'ARS',
      occurredAt: at,
    });
    gateway.refundPayment.mockResolvedValue({
      provider: 'FAKE',
      externalPaymentId: 'external-1',
      externalReference: 'reservation:reservation-1',
      status: 'REFUNDED',
      amountMinorUnits: 45000,
      currency: 'ARS',
      occurredAt: at,
    });
    repository.saveStatus.mockImplementation(async (item) => item);
  });

  it('verifica, consulta datos autoritativos y persiste la aprobacion con evento', async () => {
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toEqual({ accepted: true, duplicate: false, applied: true });
    expect(gateway.getPayment).toHaveBeenCalledWith('external-1', {
      externalReference: 'reservation:reservation-1',
      amountMinorUnits: 45000,
      currency: 'ARS',
    });
    expect(repository.saveStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED' }),
      expect.objectContaining({
        externalEventId: 'event-1',
        previousStatus: 'PENDING',
        newStatus: 'APPROVED',
      }),
    );
  });

  it('responde idempotentemente sin consultar al proveedor si el evento ya existe', async () => {
    repository.externalEventExists.mockResolvedValue(true);
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toEqual({ accepted: true, duplicate: true, applied: false });
    expect(gateway.getPayment).not.toHaveBeenCalled();
  });

  it('ignora tipos firmados ajenos a pagos', async () => {
    gateway.verifyAndParseWebhook.mockResolvedValue({
      eventId: 'event-2',
      externalPaymentId: 'external-1',
      eventType: 'merchant_order',
    });
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toEqual({ accepted: true, duplicate: false, applied: false });
    expect(repository.externalEventExists).not.toHaveBeenCalled();
    expect(gateway.getPayment).not.toHaveBeenCalled();
  });

  it('acepta sin efectos un pago externo firmado que no existe localmente', async () => {
    repository.findByExternalPaymentId.mockResolvedValue(null);
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toEqual({ accepted: true, duplicate: false, applied: false });
    expect(gateway.getPayment).not.toHaveBeenCalled();
  });

  it('absorbe la carrera del constraint unico como duplicado', async () => {
    repository.saveStatus.mockRejectedValue(new DuplicatePaymentEventError());
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toMatchObject({ duplicate: true });
  });

  it('no degrada un pago aprobado por un evento tardio', async () => {
    repository.findByExternalPaymentId.mockResolvedValue(payment('APPROVED'));
    gateway.getPayment.mockResolvedValue({
      ...(await gateway.getPayment()),
      status: 'PROCESSING',
    });
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toMatchObject({ applied: false });
    expect(repository.saveStatus.mock.calls[0][0].status).toBe('APPROVED');
  });

  it('no persiste efectos si falla la consulta autoritativa', async () => {
    gateway.getPayment.mockRejectedValue(
      new PaymentGatewayError('timeout', true),
    );
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).rejects.toMatchObject({ retryable: true });
    expect(repository.saveStatus).not.toHaveBeenCalled();
  });

  it('reembolsa idempotentemente una segunda aprobacion para la misma reserva', async () => {
    repository.saveStatus
      .mockRejectedValueOnce(new DuplicateReservationApprovalError())
      .mockImplementationOnce(async (item) => item);
    await expect(
      useCase.execute({ rawBody: '{}', headers: {} }),
    ).resolves.toMatchObject({ applied: true });
    expect(gateway.refundPayment).toHaveBeenCalledWith(
      'external-1',
      'duplicate-approval:payment-1',
    );
    expect(repository.saveStatus.mock.calls[1][0].status).toBe('REFUNDED');
  });
});
