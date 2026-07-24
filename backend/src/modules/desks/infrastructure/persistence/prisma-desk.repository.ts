import { Injectable } from '@nestjs/common';
import { DeskZone, ReservationStatus } from '@prisma/client';

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
    const deskAvailability = await this.findAvailableByTimeSlot(params);
    const grouped = new Map<
      string,
      {
        area: WorkAreaProperties;
        availableDeskCount: number;
        totalDeskCount: number;
      }
    >();

    for (const { desk, reservedSlots } of deskAvailability) {
      if (!desk.area) continue;
      const current = grouped.get(desk.area.id) ?? {
        area: desk.area,
        availableDeskCount: 0,
        totalDeskCount: 0,
      };
      const hasOverlap = reservedSlots.some((reservedSlot) =>
        this.overlaps(
          params.startTime,
          params.endTime,
          reservedSlot.startTime,
          reservedSlot.endTime,
        ),
      );

      current.totalDeskCount += 1;
      if (!hasOverlap) {
        current.availableDeskCount += 1;
      }
      grouped.set(desk.area.id, current);
    }

    return Array.from(grouped.values()).filter(
      (item) => item.availableDeskCount > 0,
    );
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
