import { Injectable } from '@nestjs/common';
import { DeskZone, Prisma, ReservationStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Desk, WorkAreaProperties } from '../../domain/entities/desk.entity';
import {
  CreateDeskParams,
  DeskAvailabilityResult,
  DeskRepositoryPort,
  FindAvailableDesksParams,
  ListDesksParams,
  ListDesksResult,
  UpdateDeskParams,
} from '../../domain/ports/desk-repository.port';

const deskRelations = {
  description: {
    select: {
      id: true,
      name: true,
      description: true,
      peopleCapacity: true,
    },
  },
  amenities: {
    include: {
      amenity: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  area: {
    select: {
      id: true,
      name: true,
      description: true,
      localityId: true,
      address: true,
      latitude: true,
      longitude: true,
      active: true,
      locality: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
    },
  },
};

@Injectable()
export class PrismaDeskRepository implements DeskRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableByTimeSlot(
    params: FindAvailableDesksParams,
  ): Promise<DeskAvailabilityResult[]> {
    const desks = await this.prisma.desk.findMany({
      where: {
        enabled: true,
        deletedAt: null,
        ...(params.zone ? { zone: params.zone } : {}),
        ...(params.areaId ? { areaId: params.areaId } : {}),
        area: {
          active: true,
          ...(params.localityId ? { localityId: params.localityId } : {}),
          locality: {
            active: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
      include: {
        ...deskRelations,
        reservations: {
          where: {
            date: this.toDate(params.date),
            status: {
              in: [
                ReservationStatus.PENDING_PAYMENT,
                ReservationStatus.RESERVED,
                ReservationStatus.ACTIVE,
              ],
            },
          },
          select: {
            startTime: true,
            endTime: true,
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });

    return desks.map((desk) => ({
      desk: this.toDomain(desk),
      reservedSlots: desk.reservations.map((reservation) => ({
        startTime: this.fromTime(reservation.startTime),
        endTime: this.fromTime(reservation.endTime),
      })),
    }));
  }

  async list(params: ListDesksParams): Promise<ListDesksResult> {
    const where = {
      deletedAt: null,
    };
    const [desks, total] = await this.prisma.$transaction([
      this.prisma.desk.findMany({
        where,
        orderBy: {
          code: 'asc',
        },
        include: deskRelations,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.desk.count({ where }),
    ]);

    return {
      desks: desks.map((desk) => this.toDomain(desk)),
      total,
    };
  }

  async listLocalities(activeOnly = true) {
    const localities = await this.prisma.locality.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    return localities;
  }

  async listWorkAreas(params: { localityId?: string; activeOnly?: boolean }) {
    const areas = await this.prisma.workArea.findMany({
      where: {
        ...((params.activeOnly ?? true) ? { active: true } : {}),
        ...(params.localityId ? { localityId: params.localityId } : {}),
        locality: (params.activeOnly ?? true) ? { active: true } : undefined,
      },
      orderBy: [{ locality: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        localityId: true,
        address: true,
        latitude: true,
        longitude: true,
        active: true,
        locality: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    return areas;
  }

  async findWorkAreaById(id: string) {
    const area = await this.prisma.workArea.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        localityId: true,
        address: true,
        latitude: true,
        longitude: true,
        active: true,
        locality: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    return area;
  }

  async findAvailableWorkAreasByTimeSlot(params: FindAvailableDesksParams) {
    type AvailabilityRow = {
      id: string;
      name: string;
      description: string | null;
      localityId: string;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      active: boolean;
      localityName: string;
      localityActive: boolean;
      availableDeskCount: bigint;
      totalDeskCount: bigint;
    };

    const availableDeskCount = Prisma.sql`
      COUNT(d.id) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM "reservations" r
          WHERE r."desk_id" = d.id
            AND r."date" = ${params.date}::date
            AND r."status" IN (
              'PENDING_PAYMENT'::"ReservationStatus",
              'RESERVED'::"ReservationStatus",
              'ACTIVE'::"ReservationStatus"
            )
            AND r."start_time" < ${params.endTime}::time
            AND r."end_time" > ${params.startTime}::time
        )
      )
    `;
    const rows = await this.prisma.$queryRaw<AvailabilityRow[]>(Prisma.sql`
      SELECT
        wa.id,
        wa.name,
        wa.description,
        wa."locality_id" AS "localityId",
        wa.address,
        wa.latitude,
        wa.longitude,
        wa.active,
        l.name AS "localityName",
        l.active AS "localityActive",
        ${availableDeskCount} AS "availableDeskCount",
        COUNT(d.id) AS "totalDeskCount"
      FROM "desks" d
      INNER JOIN "work_areas" wa ON wa.id = d."area_id"
      INNER JOIN "localities" l ON l.id = wa."locality_id"
      WHERE d.enabled = TRUE
        AND d."deleted_at" IS NULL
        AND wa.active = TRUE
        AND l.active = TRUE
        ${params.zone ? Prisma.sql`AND d.zone = ${params.zone}::"DeskZone"` : Prisma.empty}
        ${params.areaId ? Prisma.sql`AND d."area_id" = ${params.areaId}::uuid` : Prisma.empty}
        ${params.localityId ? Prisma.sql`AND wa."locality_id" = ${params.localityId}::uuid` : Prisma.empty}
      GROUP BY wa.id, l.id
      HAVING ${availableDeskCount} > 0
      ORDER BY MIN(d.code) ASC
    `);

    return rows.map((row) => ({
      area: {
        id: row.id,
        name: row.name,
        description: row.description,
        localityId: row.localityId,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        active: row.active,
        locality: {
          id: row.localityId,
          name: row.localityName,
          active: row.localityActive,
        },
      },
      availableDeskCount: Number(row.availableDeskCount),
      totalDeskCount: Number(row.totalDeskCount),
    }));
  }

  async findById(id: string): Promise<Desk | null> {
    const desk = await this.prisma.desk.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: deskRelations,
    });

    return desk ? this.toDomain(desk) : null;
  }

  async findByName(name: string, excludeId?: string): Promise<Desk | null> {
    const desk = await this.prisma.desk.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: deskRelations,
    });

    return desk ? this.toDomain(desk) : null;
  }

  async create(params: CreateDeskParams): Promise<Desk> {
    const { amenityIds, ...data } = params;
    const desk = await this.prisma.desk.create({
      data: {
        ...data,
        ...(amenityIds
          ? {
              amenities: {
                create: amenityIds.map((amenityId) => ({
                  amenityId,
                })),
              },
            }
          : {}),
      },
      include: deskRelations,
    });

    return this.toDomain(desk);
  }

  async update(params: UpdateDeskParams): Promise<Desk> {
    const { id, amenityIds, ...data } = params;
    const desk = await this.prisma.desk.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(amenityIds
          ? {
              amenities: {
                deleteMany: {},
                create: amenityIds.map((amenityId) => ({
                  amenityId,
                })),
              },
            }
          : {}),
      },
      include: deskRelations,
    });

    return this.toDomain(desk);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.desk.update({
      where: {
        id,
      },
      data: {
        enabled: false,
        deletedAt: new Date(),
      },
    });
  }

  private toDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private toTime(value: string): Date {
    return new Date(`1970-01-01T${value}:00.000Z`);
  }

  private fromTime(value: Date): string {
    return value.toISOString().slice(11, 16);
  }

  private overlaps(
    startTime: string,
    endTime: string,
    reservedStartTime: string,
    reservedEndTime: string,
  ) {
    return (
      this.toMinutes(startTime) < this.toMinutes(reservedEndTime) &&
      this.toMinutes(endTime) > this.toMinutes(reservedStartTime)
    );
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private toDomain(desk: {
    id: string;
    code: string;
    name: string | null;
    peopleCapacity: number;
    descriptionId: string | null;
    description: {
      id: string;
      name: string;
      description: string | null;
      peopleCapacity: number;
    } | null;
    areaId: string;
    area: {
      id: string;
      name: string;
      description: string | null;
      localityId: string;
      active: boolean;
      locality: {
        id: string;
        name: string;
        active: boolean;
      };
    };
    zone: DeskZone | null;
    amenities: {
      amenity: {
        id: string;
        name: string;
      };
    }[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    reservations?: {
      startTime: Date;
      endTime: Date;
    }[];
  }): Desk {
    return new Desk({
      id: desk.id,
      code: desk.code,
      name: desk.name,
      peopleCapacity: desk.peopleCapacity,
      descriptionId: desk.descriptionId,
      description: desk.description,
      areaId: desk.areaId,
      area: desk.area,
      zone: desk.zone,
      amenities: desk.amenities.map(({ amenity }) => amenity),
      enabled: desk.enabled,
      createdAt: desk.createdAt,
      updatedAt: desk.updatedAt,
      deletedAt: desk.deletedAt,
    });
  }
}
