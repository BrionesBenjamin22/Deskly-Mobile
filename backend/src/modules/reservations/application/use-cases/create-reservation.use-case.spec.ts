import { Desk } from '../../../desks/domain/entities/desk.entity';
import { LocalityInactiveError } from '../../../desks/domain/errors/locality-inactive.error';
import { DeskNotFoundError } from '../../../desks/domain/errors/desk-not-found.error';
import { WorkAreaInactiveError } from '../../../desks/domain/errors/work-area-inactive.error';
import { InvalidTimeRangeError } from '../../../desks/domain/errors/invalid-time-range.error';
import type { DeskRepositoryPort } from '../../../desks/domain/ports/desk-repository.port';
import { Reservation } from '../../domain/entities/reservation.entity';
import { DeskUnavailableError } from '../../domain/errors/desk-unavailable.error';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { CreateReservationUseCase } from './create-reservation.use-case';

const desk = new Desk({
  id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
  code: 'D-01',
  name: 'Escritorio 1',
  peopleCapacity: 2,
  enabled: true,
});
const memberId = '8ae2e38a-300c-4cc1-b6ba-cee270f163f7';

function createDeskRepositoryMock(): jest.Mocked<DeskRepositoryPort> {
  return {
    findAvailableByTimeSlot: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    listLocalities: jest.fn(),
    listWorkAreas: jest.fn(),
    findWorkAreaById: jest.fn(),
    findAvailableWorkAreasByTimeSlot: jest.fn(),
  };
}

function createReservationRepositoryMock(): jest.Mocked<ReservationRepositoryPort> {
  return {
    memberExists: jest.fn(),
    existsOverlappingReservation: jest.fn(),
    save: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    validateArrival: jest.fn(),
  };
}

describe('CreateReservationUseCase', () => {
  let deskRepository: jest.Mocked<DeskRepositoryPort>;
  let reservationRepository: jest.Mocked<ReservationRepositoryPort>;
  let useCase: CreateReservationUseCase;

  beforeEach(() => {
    deskRepository = createDeskRepositoryMock();
    reservationRepository = createReservationRepositoryMock();
    useCase = new CreateReservationUseCase(
      deskRepository,
      reservationRepository,
    );
    reservationRepository.memberExists.mockResolvedValue(true);
  });

  it('creates an active reservation when the desk is available', async () => {
    deskRepository.findById.mockResolvedValue(desk);
    reservationRepository.existsOverlappingReservation.mockResolvedValue(false);
    reservationRepository.save.mockResolvedValue(
      new Reservation({
        id: '2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4',
        deskId: desk.id,
        memberId,
        deskCode: desk.code,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '13:00',
        status: 'RESERVED',
      }),
    );

    const output = await useCase.execute({
      deskId: desk.id,
      memberId,
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
    });

    expect(output).toEqual({
      reservationId: '2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4',
      deskId: desk.id,
      memberId,
      deskCode: 'D-01',
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '13:00',
      status: 'RESERVED',
    });
  });

  it('rejects an unavailable desk', async () => {
    deskRepository.findById.mockResolvedValue(desk);
    reservationRepository.existsOverlappingReservation.mockResolvedValue(true);

    await expect(
      useCase.execute({
        deskId: desk.id,
        memberId,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(DeskUnavailableError);
  });

  it('rejects a missing desk', async () => {
    deskRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        deskId: desk.id,
        memberId,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(DeskNotFoundError);
  });

  it('rejects a desk whose work area is inactive', async () => {
    deskRepository.findById.mockResolvedValue(
      new Desk({
        id: desk.id,
        code: desk.code,
        name: desk.name,
        peopleCapacity: desk.peopleCapacity,
        enabled: true,
        areaId: '11111111-1111-4111-8111-111111111111',
        area: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Area silenciosa',
          localityId: '00000000-0000-4000-8000-000000000001',
          active: false,
          locality: {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'La Plata',
            active: true,
          },
        },
      }),
    );

    await expect(
      useCase.execute({
        deskId: desk.id,
        memberId,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(WorkAreaInactiveError);
  });

  it('rejects a desk whose locality is inactive', async () => {
    deskRepository.findById.mockResolvedValue(
      new Desk({
        id: desk.id,
        code: desk.code,
        name: desk.name,
        peopleCapacity: desk.peopleCapacity,
        enabled: true,
        areaId: '11111111-1111-4111-8111-111111111111',
        area: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Area silenciosa',
          localityId: '00000000-0000-4000-8000-000000000001',
          active: true,
          locality: {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'La Plata',
            active: false,
          },
        },
      }),
    );

    await expect(
      useCase.execute({
        deskId: desk.id,
        memberId,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(LocalityInactiveError);
  });

  it('rejects an invalid time range before checking availability', async () => {
    await expect(
      useCase.execute({
        deskId: desk.id,
        memberId,
        date: '2026-06-01',
        startTime: '13:00',
        endTime: '09:00',
      }),
    ).rejects.toThrow(InvalidTimeRangeError);
    expect(
      reservationRepository.existsOverlappingReservation.mock.calls,
    ).toHaveLength(0);
  });
});
