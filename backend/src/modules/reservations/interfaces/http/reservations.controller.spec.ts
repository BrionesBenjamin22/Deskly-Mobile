import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { ForbiddenException } from '@nestjs/common';
import { GetReservationByIdUseCase } from '../../application/use-cases/get-reservation-by-id.use-case';
import { ListReservationsUseCase } from '../../application/use-cases/list-reservations.use-case';
import { UpdateReservationUseCase } from '../../application/use-cases/update-reservation.use-case';
import { Reservation } from '../../domain/entities/reservation.entity';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { ReservationsController } from './reservations.controller';

const authenticatedMemberId = 'member-1';

const createReservation = (
  id: string,
  memberId: string,
  relation: {
    deskId: string;
    deskCode: string;
    areaId: string;
    areaName: string;
    localityId: string;
    localityName: string;
  },
) =>
  new Reservation({
    id,
    memberId,
    date: '2026-07-14',
    startTime: '09:00',
    endTime: '13:00',
    status: 'RESERVED',
    ...relation,
  });

const reservations = [
  createReservation('reservation-1', authenticatedMemberId, {
    deskId: 'desk-1',
    deskCode: 'A-01',
    areaId: 'area-1',
    areaName: 'Area abierta',
    localityId: 'locality-1',
    localityName: 'Chascomus',
  }),
  createReservation('reservation-2', authenticatedMemberId, {
    deskId: 'desk-2',
    deskCode: 'S-02',
    areaId: 'area-2',
    areaName: 'Sala silenciosa',
    localityId: 'locality-2',
    localityName: 'La Plata',
  }),
  createReservation('reservation-from-another-member', 'member-2', {
    deskId: 'desk-3',
    deskCode: 'P-03',
    areaId: 'area-3',
    areaName: 'Sala privada',
    localityId: 'locality-3',
    localityName: 'Dolores',
  }),
];

const createRepositoryMock = (): jest.Mocked<ReservationRepositoryPort> => ({
  memberExists: jest.fn(),
  existsOverlappingReservation: jest.fn(),
  save: jest.fn(),
  list: jest.fn(async ({ memberId, page, limit }) => {
    const scopedReservations = memberId
      ? reservations.filter((reservation) => reservation.memberId === memberId)
      : reservations;
    const start = (page - 1) * limit;

    return {
      reservations: scopedReservations.slice(start, start + limit),
      total: scopedReservations.length,
    };
  }),
  findById: jest.fn(),
  update: jest.fn(),
  cancel: jest.fn(),
  validateArrival: jest.fn(),
});

describe('ReservationsController secured listing', () => {
  it('returns only the authenticated member reservations with default pagination and related data', async () => {
    const repository = createRepositoryMock();
    const listReservationsUseCase = new ListReservationsUseCase(repository);
    const controller = new ReservationsController(
      {} as never,
      listReservationsUseCase,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const request = {
      user: {
        id: 'user-1',
        username: 'member',
        email: 'member@deskly.test',
        role: 'MIEMBRO',
        active: true,
        member: {
          id: authenticatedMemberId,
          fullName: 'Ada Lovelace',
          dni: 12345678,
          phone: 1112345678,
          active: true,
        },
      },
    } as unknown as AuthenticatedRequest;

    const output = await controller.list({}, request);

    expect(repository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 9,
      memberId: authenticatedMemberId,
    });
    expect(output.pagination).toEqual({
      page: 1,
      limit: 9,
      total: 2,
      totalPages: 1,
    });
    expect(output.reservations).toMatchObject([
      {
        reservationId: 'reservation-1',
        memberId: authenticatedMemberId,
        location: {
          areaId: 'area-1',
          localityId: 'locality-1',
        },
      },
      {
        reservationId: 'reservation-2',
        memberId: authenticatedMemberId,
        location: {
          areaId: 'area-2',
          localityId: 'locality-2',
        },
      },
    ]);
    expect(output.reservations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: 'member-2' }),
      ]),
    );
  });

  it('rejects reading a reservation owned by another member', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(reservations[2]);
    const controller = new ReservationsController(
      {} as never,
      new ListReservationsUseCase(repository),
      new GetReservationByIdUseCase(repository),
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.findById(
        reservations[2].id!,
        createAuthenticatedRequest('MIEMBRO', authenticatedMemberId),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a gestor to read a reservation from any member', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(reservations[2]);
    const controller = new ReservationsController(
      {} as never,
      new ListReservationsUseCase(repository),
      new GetReservationByIdUseCase(repository),
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.findById(
        reservations[2].id!,
        createAuthenticatedRequest('GESTOR'),
      ),
    ).resolves.toMatchObject({
      reservationId: 'reservation-from-another-member',
      memberId: 'member-2',
    });
  });

  it('rejects updating a reservation owned by another member', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(reservations[2]);
    const updateUseCase = {
      execute: jest.fn(),
    } as unknown as UpdateReservationUseCase;
    const controller = new ReservationsController(
      {} as never,
      new ListReservationsUseCase(repository),
      new GetReservationByIdUseCase(repository),
      updateUseCase,
      {} as never,
      {} as never,
    );

    await expect(
      controller.update(
        reservations[2].id!,
        { startTime: '10:00' },
        createAuthenticatedRequest('MIEMBRO', authenticatedMemberId),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(updateUseCase.execute).not.toHaveBeenCalled();
  });
});

function createAuthenticatedRequest(
  role: 'ADMIN' | 'GESTOR' | 'MIEMBRO',
  memberId?: string,
): AuthenticatedRequest {
  return {
    user: {
      id: 'user-1',
      username: 'authenticated-user',
      email: 'user@deskly.test',
      role,
      active: true,
      member: memberId
        ? {
            id: memberId,
            fullName: 'Ada Lovelace',
            dni: 12345678,
            phone: 1112345678,
            active: true,
          }
        : null,
    },
  } as unknown as AuthenticatedRequest;
}
