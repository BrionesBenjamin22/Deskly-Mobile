import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { ListReservationsUseCase } from '../../application/use-cases/list-reservations.use-case';
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
});
