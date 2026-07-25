import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { LocalitiesService } from './localities.service';
import { WorkAreasService } from './work-areas.service';

describe('Administrative location services', () => {
  const prisma = {
    locality: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workArea: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    desk: { count: jest.fn() },
  };

  const localities = new LocalitiesService(prisma as unknown as PrismaService);
  const areas = new WorkAreasService(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('crea una localidad normalizando su nombre', async () => {
    prisma.locality.findFirst.mockResolvedValue(null);
    prisma.locality.create.mockResolvedValue({
      id: 'locality-1',
      name: 'Chascomús',
      active: true,
    });

    await localities.create({ name: ' Chascomús ' });

    expect(prisma.locality.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Chascomús', active: true },
      }),
    );
  });

  it('impide eliminar una localidad con areas activas', async () => {
    prisma.locality.findUnique.mockResolvedValue({ id: 'locality-1' });
    prisma.workArea.count.mockResolvedValue(1);

    await expect(localities.remove('locality-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza un area cuya localidad no esta activa', async () => {
    prisma.locality.findFirst.mockResolvedValue(null);

    await expect(
      areas.create({ name: 'Sala norte', localityId: 'locality-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('impide eliminar un area que conserva escritorios', async () => {
    prisma.workArea.findUnique.mockResolvedValue({ id: 'area-1' });
    prisma.desk.count.mockResolvedValue(1);

    await expect(areas.remove('area-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
