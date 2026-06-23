import { Desk } from '../../../desks/domain/entities/desk.entity';
import { DeskNotFoundError } from '../../../desks/domain/errors/desk-not-found.error';
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
    markReservedAfterPayment: jest.fn(),
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
        status: 'PENDING_PAYMENT',
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
      status: 'PENDING_PAYMENT',
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
