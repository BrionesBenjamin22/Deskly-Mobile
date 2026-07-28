import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PrismaReservationRepository } from './prisma-reservation.repository';

const relatedReservation = {
  id: 'reservation-1',
  deskId: 'desk-1',
  memberId: 'member-1',
  date: new Date('2026-07-14T00:00:00.000Z'),
  startTime: new Date('1970-01-01T09:00:00.000Z'),
  endTime: new Date('1970-01-01T13:00:00.000Z'),
  status: 'RESERVED' as const,
  createdAt: new Date('2026-07-13T10:00:00.000Z'),
  updatedAt: new Date('2026-07-13T10:00:00.000Z'),
  cancelledAt: null,
  checkedInAt: null,
  desk: {
    code: 'A-01',
    name: 'Escritorio ventana',
    area: {
      id: 'area-1',
      name: 'Area abierta',
      address: 'Av. Costanera Espana 120',
      latitude: -35.577,
      longitude: -57.997,
      locality: {
        id: 'locality-1',
        name: 'Chascomus',
      },
    },
  },
  member: { fullName: 'Ada Lovelace' },
};

const createPrismaMock = () => {
  let executedQuery = '';
  return {
    $executeRaw: jest.fn((query: TemplateStringsArray) => {
      executedQuery = query.join('');
      return Promise.resolve(0);
    }),
    getExecutedQuery: () => executedQuery,
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
    reservation: {
      findMany: jest.fn().mockResolvedValue([relatedReservation]),
      findUnique: jest.fn().mockResolvedValue(relatedReservation),
      count: jest.fn().mockResolvedValue(1),
    },
    desk: { findUnique: jest.fn() },
    workArea: { findUnique: jest.fn() },
    locality: { findUnique: jest.fn() },
  };
};

describe('PrismaReservationRepository related location persistence', () => {
  it('finaliza reservas activas o reservadas cuyo horario ya termino', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaReservationRepository(
      prisma as unknown as PrismaService,
    );

    await repository.list({ page: 1, limit: 9 });

    const query = prisma.getExecutedQuery();
    expect(query).toContain(
      `"status" IN ('ACTIVE'::"ReservationStatus", 'RESERVED'::"ReservationStatus")`,
    );
    expect(query).toContain('("date" + "end_time") <=');
  });

  it('prioriza estados vigentes antes de ordenar por fecha', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaReservationRepository(
      prisma as unknown as PrismaService,
    );

    await repository.list({ page: 1, limit: 9 });

    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ status: 'asc' }, { date: 'asc' }, { startTime: 'asc' }],
      }),
    );
  });

  it('loads and maps desk area and locality in the list query without N+1 queries', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaReservationRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.list({ page: 1, limit: 9 });

    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          desk: {
            select: {
              code: true,
              name: true,
              area: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                  locality: { select: { id: true, name: true } },
                },
              },
            },
          },
          member: { select: { fullName: true } },
        },
      }),
    );
    expect(result.reservations[0]).toMatchObject({
      properties: {
        areaId: 'area-1',
        areaName: 'Area abierta',
        localityId: 'locality-1',
        localityName: 'Chascomus',
        address: 'Av. Costanera Espana 120',
        latitude: -35.577,
        longitude: -57.997,
      },
    });
    expect(prisma.desk.findUnique).not.toHaveBeenCalled();
    expect(prisma.workArea.findUnique).not.toHaveBeenCalled();
    expect(prisma.locality.findUnique).not.toHaveBeenCalled();
  });

  it('loads and maps desk area and locality in the detail query without extra queries', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaReservationRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.findById('reservation-1');

    expect(prisma.reservation.findUnique).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      include: {
        desk: {
          select: {
            code: true,
            name: true,
            area: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                locality: { select: { id: true, name: true } },
              },
            },
          },
        },
        member: { select: { fullName: true } },
      },
    });
    expect(result).toMatchObject({
      properties: {
        areaId: 'area-1',
        areaName: 'Area abierta',
        localityId: 'locality-1',
        localityName: 'Chascomus',
        address: 'Av. Costanera Espana 120',
        latitude: -35.577,
        longitude: -57.997,
      },
    });
    expect(prisma.desk.findUnique).not.toHaveBeenCalled();
    expect(prisma.workArea.findUnique).not.toHaveBeenCalled();
    expect(prisma.locality.findUnique).not.toHaveBeenCalled();
  });
});
