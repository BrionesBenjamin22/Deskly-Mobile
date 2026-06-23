import { Penalty } from '../../domain/entities/penalty.entity';
import { AbsenceToleranceNotReachedError } from '../../domain/errors/penalty.errors';
import type { PenaltyRepositoryPort } from '../../domain/ports/penalty-repository.port';
import { PenaltyRegistrationService } from './penalty-registration.service';

function createRepository(): jest.Mocked<PenaltyRepositoryPort> {
  return {
    findReservation: jest.fn(),
    register: jest.fn(),
    list: jest.fn(),
  };
}

function createPenalty(type: 'ABSENCE' | 'LATE_CANCELLATION') {
  return new Penalty({
    id: '10000000-0000-4000-8000-000000000001',
    reservationId: '20000000-0000-4000-8000-000000000001',
    memberId: '30000000-0000-4000-8000-000000000001',
    registeredById:
      type === 'ABSENCE' ? '40000000-0000-4000-8000-000000000001' : null,
    type,
    level: 'WARNING',
    reason: 'Motivo de prueba',
    registeredAt: new Date('2026-06-23T12:00:00.000Z'),
    activeUntil: new Date('2026-07-23T12:00:00.000Z'),
  });
}

describe('PenaltyRegistrationService', () => {
  it('registers an absence after the tolerance period and cancels the reservation', async () => {
    const repository = createRepository();
    const registerMock = jest.fn<PenaltyRepositoryPort['register']>();
    repository.register = registerMock;
    repository.findReservation.mockResolvedValue({
      id: '20000000-0000-4000-8000-000000000001',
      memberId: '30000000-0000-4000-8000-000000000001',
      date: '2026-06-23',
      startTime: '10:00',
      status: 'RESERVED',
      checkedInAt: null,
    });
    registerMock.mockResolvedValue(createPenalty('ABSENCE'));
    const service = new PenaltyRegistrationService(repository);

    await service.registerAbsence({
      reservationId: '20000000-0000-4000-8000-000000000001',
      reason: 'El miembro no se presento',
      registeredById: '40000000-0000-4000-8000-000000000001',
      now: new Date('2026-06-23T14:00:00.000Z'),
    });

    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ABSENCE',
        cancelReservation: true,
        registeredById: '40000000-0000-4000-8000-000000000001',
      }),
    );
  });

  it('rejects an absence before one hour has elapsed', async () => {
    const repository = createRepository();
    repository.findReservation.mockResolvedValue({
      id: '20000000-0000-4000-8000-000000000001',
      memberId: '30000000-0000-4000-8000-000000000001',
      date: '2026-06-23',
      startTime: '10:00',
      status: 'RESERVED',
      checkedInAt: null,
    });
    const service = new PenaltyRegistrationService(repository);

    await expect(
      service.registerAbsence({
        reservationId: '20000000-0000-4000-8000-000000000001',
        reason: 'Ausencia',
        registeredById: '40000000-0000-4000-8000-000000000001',
        now: new Date('2026-06-23T13:59:59.000Z'),
      }),
    ).rejects.toBeInstanceOf(AbsenceToleranceNotReachedError);
  });

  it('registers an automatic late cancellation within two hours of the start', async () => {
    const repository = createRepository();
    const registerMock = jest.fn<PenaltyRepositoryPort['register']>();
    repository.register = registerMock;
    repository.findReservation.mockResolvedValue({
      id: '20000000-0000-4000-8000-000000000001',
      memberId: '30000000-0000-4000-8000-000000000001',
      date: '2026-06-23',
      startTime: '10:00',
      status: 'CANCELLED',
      checkedInAt: null,
    });
    registerMock.mockResolvedValue(createPenalty('LATE_CANCELLATION'));
    const service = new PenaltyRegistrationService(repository);

    await service.registerLateCancellationIfApplicable({
      reservationId: '20000000-0000-4000-8000-000000000001',
      cancelledAt: new Date('2026-06-23T11:30:00.000Z'),
    });

    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LATE_CANCELLATION',
        registeredById: null,
        cancelReservation: false,
      }),
    );
  });
});
