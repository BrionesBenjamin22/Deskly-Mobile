import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { GetAvailableWorkAreasUseCase } from './get-available-work-areas.use-case';

describe('GetAvailableWorkAreasUseCase', () => {
  let repository: jest.Mocked<DeskRepositoryPort>;
  let useCase: GetAvailableWorkAreasUseCase;

  beforeEach(() => {
    repository = {
      findAvailableWorkAreasByTimeSlot: jest.fn(),
    } as unknown as jest.Mocked<DeskRepositoryPort>;
    useCase = new GetAvailableWorkAreasUseCase(repository);
  });

  it('returns only work areas with available desks for a locality and time slot', async () => {
    repository.findAvailableWorkAreasByTimeSlot.mockResolvedValue([
      {
        area: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Area silenciosa',
          localityId: '00000000-0000-4000-8000-000000000001',
          active: true,
          locality: {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'La Plata',
            active: true,
          },
        },
        availableDeskCount: 2,
        totalDeskCount: 3,
      },
    ]);

    const output = await useCase.execute({
      localityId: '00000000-0000-4000-8000-000000000001',
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });

    expect(output).toEqual({
      areas: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Area silenciosa',
          localityId: '00000000-0000-4000-8000-000000000001',
          active: true,
          locality: {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'La Plata',
            active: true,
          },
          availableDeskCount: 2,
          totalDeskCount: 3,
        },
      ],
    });
    expect(repository.findAvailableWorkAreasByTimeSlot).toHaveBeenCalledWith({
      localityId: '00000000-0000-4000-8000-000000000001',
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });
  });
});
