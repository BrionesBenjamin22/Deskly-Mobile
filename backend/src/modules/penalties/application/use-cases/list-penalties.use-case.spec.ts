import { Penalty } from '../../domain/entities/penalty.entity';
import type { PenaltyRepositoryPort } from '../../domain/ports/penalty-repository.port';
import { ListPenaltiesUseCase } from './list-penalties.use-case';

describe('ListPenaltiesUseCase', () => {
  it('returns the active penalty count for the current member profile', async () => {
    const listMock = jest
      .fn<PenaltyRepositoryPort['list']>()
      .mockResolvedValue({
        penalties: [
          new Penalty({
            id: '10000000-0000-4000-8000-000000000001',
            reservationId: '20000000-0000-4000-8000-000000000001',
            memberId: '30000000-0000-4000-8000-000000000001',
            registeredById: null,
            type: 'LATE_CANCELLATION',
            level: 'PENALTY',
            reason: 'Cancelacion tardia',
            registeredAt: new Date('2026-06-20T12:00:00.000Z'),
            activeUntil: new Date('2026-07-20T12:00:00.000Z'),
          }),
        ],
        total: 1,
      });
    const repository: PenaltyRepositoryPort = {
      findReservation: jest.fn(),
      register: jest.fn(),
      list: listMock,
    };

    const result = await new ListPenaltiesUseCase(repository).execute({
      memberId: '30000000-0000-4000-8000-000000000001',
      page: 1,
      limit: 3,
      activeOnly: true,
    });

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ activeOnly: true, limit: 3 }),
    );
    expect(result.pagination.total).toBe(1);
  });
});
