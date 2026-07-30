import { Prisma } from '@prisma/client';

import { PrismaDeskRepository } from './prisma-desk.repository';

type PrismaMock = {
  $queryRaw: jest.Mock;
};

function queryText(query: Prisma.Sql): string {
  return query.strings.join('?').replaceAll('"', '').replace(/\s+/g, ' ').trim();
}

describe('PrismaDeskRepository work-area availability', () => {
  let prisma: PrismaMock;
  let repository: PrismaDeskRepository;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    repository = new PrismaDeskRepository(prisma as never);
  });

  it('maps areas with total and partial availability and omits fully occupied areas', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'area-total',
        name: 'Area total',
        description: null,
        localityId: 'locality-1',
        address: 'Calle 1',
        latitude: -35.5,
        longitude: -58.1,
        active: true,
        localityName: 'Chascomus',
        localityActive: true,
        availableDeskCount: 3n,
        totalDeskCount: 3n,
      },
      {
        id: 'area-partial',
        name: 'Area parcial',
        description: 'Primer piso',
        localityId: 'locality-1',
        address: null,
        latitude: null,
        longitude: null,
        active: true,
        localityName: 'Chascomus',
        localityActive: true,
        availableDeskCount: 1n,
        totalDeskCount: 2n,
      },
    ]);

    await expect(
      repository.findAvailableWorkAreasByTimeSlot({
        date: '2026-07-29',
        startTime: '09:00',
        endTime: '10:00',
      }),
    ).resolves.toEqual([
      {
        area: {
          id: 'area-total',
          name: 'Area total',
          description: null,
          localityId: 'locality-1',
          address: 'Calle 1',
          latitude: -35.5,
          longitude: -58.1,
          active: true,
          locality: {
            id: 'locality-1',
            name: 'Chascomus',
            active: true,
          },
        },
        availableDeskCount: 3,
        totalDeskCount: 3,
      },
      {
        area: {
          id: 'area-partial',
          name: 'Area parcial',
          description: 'Primer piso',
          localityId: 'locality-1',
          address: null,
          latitude: null,
          longitude: null,
          active: true,
          locality: {
            id: 'locality-1',
            name: 'Chascomus',
            active: true,
          },
        },
        availableDeskCount: 1,
        totalDeskCount: 2,
      },
    ]);

    const query = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;
    expect(queryText(query)).toContain('HAVING COUNT(d.id) FILTER');
    expect(queryText(query)).toContain('> 0');
  });

  it('uses half-open overlap boundaries so adjacent reservations remain available', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await repository.findAvailableWorkAreasByTimeSlot({
      date: '2026-07-29',
      startTime: '09:00',
      endTime: '10:00',
    });

    const query = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;
    const sql = queryText(query);
    expect(sql).toContain('r.start_time <');
    expect(sql).toContain('r.end_time >');
    expect(sql).not.toContain('r.start_time <=');
    expect(sql).not.toContain('r.end_time >=');
  });

  it('preserves zone, area, locality and active-entity filters', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await repository.findAvailableWorkAreasByTimeSlot({
      date: '2026-07-29',
      startTime: '09:00',
      endTime: '10:00',
      zone: 'B',
      areaId: '11111111-1111-4111-8111-111111111111',
      localityId: '22222222-2222-4222-8222-222222222222',
    });

    const query = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;
    const sql = queryText(query);
    expect(sql).toContain('d.enabled = TRUE');
    expect(sql).toContain('d.deleted_at IS NULL');
    expect(sql).toContain('wa.active = TRUE');
    expect(sql).toContain('l.active = TRUE');
    expect(sql).toContain('d.zone =');
    expect(sql).toContain('d.area_id =');
    expect(sql).toContain('wa.locality_id =');
    expect(query.values).toEqual(
      expect.arrayContaining([
        '2026-07-29',
        '10:00',
        '09:00',
        'B',
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ]),
    );
  });

  it('keeps pending-payment, reserved and active reservations as blockers', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await repository.findAvailableWorkAreasByTimeSlot({
      date: '2026-07-29',
      startTime: '09:00',
      endTime: '10:00',
    });

    const sql = queryText(
      prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql,
    );
    expect(sql).toContain("'PENDING_PAYMENT'");
    expect(sql).toContain("'RESERVED'");
    expect(sql).toContain("'ACTIVE'");
    expect(sql).not.toContain("'CANCELLED'");
  });
});
