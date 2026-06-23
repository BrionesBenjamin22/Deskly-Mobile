import { Desk } from '../../../desks/domain/entities/desk.entity';
import type { DeskRepositoryPort } from '../../../desks/domain/ports/desk-repository.port';
import { Reservation } from '../../domain/entities/reservation.entity';
import { ReservationCannotBeCancelledError } from '../../domain/errors/reservation-cannot-be-cancelled.error';
import { ReservationCannotBeUpdatedError } from '../../domain/errors/reservation-cannot-be-updated.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { CancelReservationUseCase } from './cancel-reservation.use-case';
import { GetReservationByIdUseCase } from './get-reservation-by-id.use-case';
import { ListReservationsUseCase } from './list-reservations.use-case';
import { UpdateReservationUseCase } from './update-reservation.use-case';
import { ValidateArrivalUseCase } from './validate-arrival.use-case';

const desk = new Desk({
  id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
  code: 'D-01',
  name: 'Escritorio 1',
  peopleCapacity: 2,
  enabled: true,
});
const memberId = '8ae2e38a-300c-4cc1-b6ba-cee270f163f7';

const activeReservation = new Reservation({
  id: '2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4',
  deskId: desk.id,
  memberId,
  deskCode: desk.code,
  deskName: desk.name,
  date: '2026-06-01',
  startTime: '09:00',
  endTime: '13:00',
  status: 'ACTIVE',
});

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
  };
}

describe('Reservation CRUD use cases', () => {
  let deskRepository: jest.Mocked<DeskRepositoryPort>;
  let reservationRepository: jest.Mocked<ReservationRepositoryPort>;

  beforeEach(() => {
    deskRepository = createDeskRepositoryMock();
    reservationRepository = createReservationRepositoryMock();
  });

  it('lists reservations with default pagination', async () => {
    reservationRepository.list.mockResolvedValue({
      reservations: [activeReservation],
      total: 1,
    });

    const output = await new ListReservationsUseCase(
      reservationRepository,
    ).execute({});

    expect(output.pagination).toEqual({
      page: 1,
      limit: 9,
      total: 1,
      totalPages: 1,
    });
    expect(output.reservations[0]?.reservationId).toBe(activeReservation.id);
  });

  it('gets a reservation by id', async () => {
    reservationRepository.findById.mockResolvedValue(activeReservation);

    const output = await new GetReservationByIdUseCase(
      reservationRepository,
    ).execute(activeReservation.id ?? '');

    expect(output.reservationId).toBe(activeReservation.id);
  });

  it('rejects missing reservation detail', async () => {
    reservationRepository.findById.mockResolvedValue(null);

    await expect(
      new GetReservationByIdUseCase(reservationRepository).execute(
        activeReservation.id ?? '',
      ),
    ).rejects.toThrow(ReservationNotFoundError);
  });

  it('updates an active reservation after revalidating availability', async () => {
    reservationRepository.findById.mockResolvedValue(activeReservation);
    reservationRepository.existsOverlappingReservation.mockResolvedValue(false);
    reservationRepository.update.mockResolvedValue(activeReservation);
    deskRepository.findById.mockResolvedValue(desk);

    await new UpdateReservationUseCase(
      deskRepository,
      reservationRepository,
    ).execute({
      id: activeReservation.id ?? '',
      startTime: '10:00',
      endTime: '14:00',
    });

    expect(reservationRepository.update.mock.calls[0]?.[0]).toEqual({
      id: activeReservation.id,
      deskId: desk.id,
      date: '2026-06-01',
      startTime: '10:00',
      endTime: '14:00',
    });
  });

  it('rejects updating a cancelled reservation', async () => {
    reservationRepository.findById.mockResolvedValue(
      new Reservation({
        ...activeReservation,
        id: activeReservation.id,
        deskId: activeReservation.deskId,
        memberId: activeReservation.memberId,
        date: activeReservation.date,
        startTime: activeReservation.startTime,
        endTime: activeReservation.endTime,
        status: 'CANCELLED',
      }),
    );

    await expect(
      new UpdateReservationUseCase(
        deskRepository,
        reservationRepository,
      ).execute({
        id: activeReservation.id ?? '',
        startTime: '10:00',
      }),
    ).rejects.toThrow(ReservationCannotBeUpdatedError);
  });

  it('cancels an active reservation', async () => {
    const cancelledAt = new Date('2026-06-01T10:30:00.000Z');
    reservationRepository.findById.mockResolvedValue(activeReservation);
    reservationRepository.cancel.mockResolvedValue(
      new Reservation({
        id: activeReservation.id,
        deskId: activeReservation.deskId,
        memberId: activeReservation.memberId,
        deskCode: activeReservation.deskCode,
        date: activeReservation.date,
        startTime: activeReservation.startTime,
        endTime: activeReservation.endTime,
        status: 'CANCELLED',
        cancelledAt,
      }),
    );

    const output = await new CancelReservationUseCase(
      reservationRepository,
    ).execute(activeReservation.id ?? '');

    expect(output).toEqual({
      reservationId: activeReservation.id,
      status: 'CANCELLED',
      cancelledAt: cancelledAt.toISOString(),
    });
  });

  it('rejects cancelling a reservation that is not active', async () => {
    reservationRepository.findById.mockResolvedValue(
      new Reservation({
        id: activeReservation.id,
        deskId: activeReservation.deskId,
        memberId: activeReservation.memberId,
        deskCode: activeReservation.deskCode,
        date: activeReservation.date,
        startTime: activeReservation.startTime,
        endTime: activeReservation.endTime,
        status: 'CANCELLED',
      }),
    );

    await expect(
      new CancelReservationUseCase(reservationRepository).execute(
        activeReservation.id ?? '',
      ),
    ).rejects.toThrow(ReservationCannotBeCancelledError);
  });

  it('validates arrival for an active reservation on the current day', async () => {
    const todayReservation = new Reservation({
      id: activeReservation.id,
      deskId: activeReservation.deskId,
      memberId: activeReservation.memberId,
      deskCode: activeReservation.deskCode,
      date: '2026-06-23',
      startTime: activeReservation.startTime,
      endTime: activeReservation.endTime,
      status: 'ACTIVE',
    });
    const checkedInReservation = new Reservation({
      id: activeReservation.id,
      deskId: activeReservation.deskId,
      memberId: activeReservation.memberId,
      deskCode: activeReservation.deskCode,
      date: '2026-06-23',
      startTime: activeReservation.startTime,
      endTime: activeReservation.endTime,
      status: 'ACTIVE',
      checkedInAt: new Date('2026-06-23T12:00:00.000Z'),
    });
    reservationRepository.findById.mockResolvedValue(todayReservation);
    reservationRepository.validateArrival.mockResolvedValue(
      checkedInReservation,
    );

    const output = await new ValidateArrivalUseCase(
      reservationRepository,
    ).execute(activeReservation.id ?? '', new Date('2026-06-23T12:00:00.000Z'));

    expect(output.checkedInAt).toBe('2026-06-23T12:00:00.000Z');
  });
});
