import { Desk } from '../../domain/entities/desk.entity';
import { InvalidTimeRangeError } from '../../domain/errors/invalid-time-range.error';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { GetAvailableDesksUseCase } from './get-available-desks.use-case';

describe('GetAvailableDesksUseCase', () => {
  let repository: jest.Mocked<DeskRepositoryPort>;
  let useCase: GetAvailableDesksUseCase;

  beforeEach(() => {
    repository = {
      findAvailableByTimeSlot: jest.fn(),
    };
    useCase = new GetAvailableDesksUseCase(repository);
  });

  it('returns available desks', async () => {
    repository.findAvailableByTimeSlot.mockResolvedValue([
      {
        desk: new Desk({
          id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
          code: 'D-01',
          name: 'Escritorio 1',
          peopleCapacity: 2,
          zone: 'A',
          amenities: [
            { id: '6a3deca2-0063-4e6c-b1ee-a95666b5efdc', name: 'Monitor' },
          ],
          enabled: true,
        }),
        reservedSlots: [],
      },
    ]);

    const output = await useCase.execute({
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });

    expect(output).toEqual({
      desks: [
        {
          id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
          code: 'D-01',
          name: 'Escritorio 1',
          peopleCapacity: 2,
          zone: 'A',
          amenities: [
            {
              id: '6a3deca2-0063-4e6c-b1ee-a95666b5efdc',
              name: 'Monitor',
            },
          ],
          status: 'available',
          reservedSlots: [],
        },
      ],
    });
    expect(repository.findAvailableByTimeSlot.mock.calls[0]?.[0]).toEqual({
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });
  });

  it('returns an empty list when there are no available desks', async () => {
    repository.findAvailableByTimeSlot.mockResolvedValue([]);

    const output = await useCase.execute({
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });

    expect(output).toEqual({ desks: [] });
  });

  it('rejects an invalid time range before querying persistence', async () => {
    await expect(
      useCase.execute({
        date: '2026-06-01',
        startTime: '13:00',
        endTime: '09:00',
      }),
    ).rejects.toThrow(InvalidTimeRangeError);
    expect(repository.findAvailableByTimeSlot.mock.calls).toHaveLength(0);
  });

  it('returns unavailable desks with reserved slots', async () => {
    repository.findAvailableByTimeSlot.mockResolvedValue([
      {
        desk: new Desk({
          id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
          code: 'D-01',
          name: 'Escritorio 1',
          peopleCapacity: 2,
          enabled: true,
        }),
        reservedSlots: [{ startTime: '09:00', endTime: '13:00' }],
      },
    ]);

    const output = await useCase.execute({
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });

    expect(output.desks[0]).toMatchObject({
      id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
      status: 'unavailable',
      reservedSlots: [{ startTime: '09:00', endTime: '13:00' }],
    });
  });

  it('keeps desks available when reservations do not overlap the requested slot', async () => {
    repository.findAvailableByTimeSlot.mockResolvedValue([
      {
        desk: new Desk({
          id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
          code: 'D-01',
          name: 'Escritorio 1',
          peopleCapacity: 2,
          enabled: true,
        }),
        reservedSlots: [{ startTime: '09:00', endTime: '10:00' }],
      },
    ]);

    const output = await useCase.execute({
      date: '2026-06-01',
      startTime: '10:00',
      endTime: '11:00',
    });

    expect(output.desks[0]).toMatchObject({
      id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
      status: 'available',
      reservedSlots: [{ startTime: '09:00', endTime: '10:00' }],
    });
  });
});
