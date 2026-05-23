import { Injectable } from '@nestjs/common';
import { DeskZone, ReservationStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Desk } from '../../domain/entities/desk.entity';
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
      },
      orderBy: {
        code: 'asc',
      },
      include: {
        ...deskRelations,
        reservations: {
          where: {
            date: this.toDate(params.date),
            status: ReservationStatus.ACTIVE,
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
      zone: desk.zone,
      amenities: desk.amenities.map(({ amenity }) => amenity),
      enabled: desk.enabled,
      createdAt: desk.createdAt,
      updatedAt: desk.updatedAt,
      deletedAt: desk.deletedAt,
    });
  }
}
