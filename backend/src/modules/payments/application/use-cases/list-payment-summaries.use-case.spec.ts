import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import { ListPaymentSummariesUseCase } from './list-payment-summaries.use-case';

const attempt = (status: 'PENDING' | 'APPROVED') =>
  new PaymentAttempt({
    id: `payment-${status}`,
    reservationId: 'reservation-1',
    memberId: 'member-1',
    amountMinorUnits: status === 'APPROVED' ? 180_000 : 420_000,
    currency: 'ARS',
    option: status === 'APPROVED' ? 'DEPOSIT' : 'FULL',
    pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
    provider: 'FAKE',
    status,
    idempotencyKey: `key-${status}`,
    operationFingerprint: `fingerprint-${status}`,
    externalReference: `reference-${status}`,
    expiresAt: new Date('2026-08-01T15:00:00.000Z'),
  });

describe('ListPaymentSummariesUseCase', () => {
  it('lista solo la pagina propia antes de sincronizar y calcula importes autoritativos', async () => {
    const pending = attempt('PENDING');
    const approved = attempt('APPROVED');
    const payments = {
      listPaymentSummaryCandidates: jest.fn().mockResolvedValue([
        {
          id: 'reservation-1',
          deskName: 'Escritorio 1',
          date: '2026-08-01',
          startTime: '09:00',
          endTime: '13:00',
          attempts: [pending, approved],
        },
      ]),
    };
    const synchronize = {
      execute: jest.fn((payment: PaymentAttempt) => Promise.resolve(payment)),
    };
    const useCase = new ListPaymentSummariesUseCase(
      payments as never,
      synchronize as never,
    );

    const result = await useCase.execute('member-1', 1, 9);

    expect(payments.listPaymentSummaryCandidates).toHaveBeenCalledWith(
      'member-1',
    );
    expect(synchronize.execute).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          reservationId: 'reservation-1',
          totalMinorUnits: 600_000,
          approvedMinorUnits: 180_000,
          pendingMinorUnits: 420_000,
          attempts: [
            expect.objectContaining({ status: 'PENDING' }),
            expect.objectContaining({ status: 'APPROVED' }),
          ],
        }),
      ],
      pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
    });
  });

  it('no sincroniza si la consulta propia no devuelve reservas', async () => {
    const payments = {
      listPaymentSummaryCandidates: jest.fn().mockResolvedValue([]),
    };
    const synchronize = { execute: jest.fn() };
    const useCase = new ListPaymentSummariesUseCase(
      payments as never,
      synchronize as never,
    );

    await expect(useCase.execute('member-1', 2, 9)).resolves.toEqual({
      items: [],
      pagination: { page: 2, limit: 9, total: 0, totalPages: 0 },
    });
    expect(synchronize.execute).not.toHaveBeenCalled();
  });

  it('sincroniza antes de filtrar aprobados y pagina el resultado visible', async () => {
    const pendingBecomesApproved = attempt('PENDING');
    const pendingRemainsPending = attempt('PENDING');
    const payments = {
      listPaymentSummaryCandidates: jest.fn().mockResolvedValue([
        {
          id: 'reservation-visible',
          deskName: 'Visible',
          date: '2026-08-01',
          startTime: '09:00',
          endTime: '10:00',
          attempts: [pendingBecomesApproved],
        },
        {
          id: 'reservation-hidden',
          deskName: 'Oculta',
          date: '2026-08-01',
          startTime: '10:00',
          endTime: '11:00',
          attempts: [pendingRemainsPending],
        },
      ]),
    };
    const synchronize = {
      execute: jest
        .fn()
        .mockImplementationOnce(async (payment: PaymentAttempt) => {
          payment.transitionTo('APPROVED', new Date());
          return payment;
        })
        .mockImplementationOnce(async (payment: PaymentAttempt) => payment),
    };
    const useCase = new ListPaymentSummariesUseCase(
      payments as never,
      synchronize as never,
    );

    const result = await useCase.execute('member-1', 1, 9);

    expect(synchronize.execute).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].reservationId).toBe('reservation-visible');
    expect(result.pagination).toEqual({
      page: 1,
      limit: 9,
      total: 1,
      totalPages: 1,
    });
  });

  it('filtra saldos pendientes y pagos completados antes de paginar', async () => {
    const deposit = attempt('APPROVED');
    const full = attempt('APPROVED');
    const payments = {
      listPaymentSummaryCandidates: jest.fn().mockResolvedValue([
        {
          id: 'reservation-pending',
          deskName: 'Pendiente',
          date: '2026-08-01',
          startTime: '09:00',
          endTime: '13:00',
          attempts: [deposit],
        },
        {
          id: 'reservation-completed',
          deskName: 'Completada',
          date: '2026-08-02',
          startTime: '09:00',
          endTime: '11:00',
          attempts: [full, attempt('APPROVED')],
        },
      ]),
    };
    const synchronize = {
      execute: jest.fn((payment: PaymentAttempt) => Promise.resolve(payment)),
    };
    const useCase = new ListPaymentSummariesUseCase(
      payments as never,
      synchronize as never,
    );

    const pending = await useCase.execute('member-1', 1, 9, 'PENDING');
    const completed = await useCase.execute('member-1', 1, 9, 'COMPLETED');

    expect(pending.items.map((item) => item.reservationId)).toEqual([
      'reservation-pending',
    ]);
    expect(completed.items.map((item) => item.reservationId)).toEqual([
      'reservation-completed',
    ]);
    expect(pending.pagination.total).toBe(1);
    expect(completed.pagination.total).toBe(1);
  });
});
