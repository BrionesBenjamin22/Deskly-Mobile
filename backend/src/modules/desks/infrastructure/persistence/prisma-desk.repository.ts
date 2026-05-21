import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Desk } from '../../domain/entities/desk.entity';
import {
  CreateDeskParams,
  DeskRepositoryPort,
  FindAvailableDesksParams,
  ListDesksParams,
  ListDesksResult,
  UpdateDeskParams,
} from '../../domain/ports/desk-repository.port';

@Injectable()
export class PrismaDeskRepository implements DeskRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableByTimeSlot(
    params: FindAvailableDesksParams,
  ): Promise<Desk[]> {
    const desks = await this.prisma.desk.findMany({
      where: {
        enabled: true,
        deletedAt: null,
        reservations: {
          none: {
            date: this.toDate(params.date),
            status: ReservationStatus.ACTIVE,
            startTime: {
              lt: this.toTime(params.endTime),
            },
            endTime: {
              gt: this.toTime(params.startTime),
            },
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    return desks.map((desk) => this.toDomain(desk));
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
    });

    return desk ? this.toDomain(desk) : null;
  }

  async findByCode(code: string): Promise<Desk | null> {
    const desk = await this.prisma.desk.findFirst({
      where: {
        code,
      },
    });

    return desk ? this.toDomain(desk) : null;
  }

  async create(params: CreateDeskParams): Promise<Desk> {
    const desk = await this.prisma.desk.create({
      data: params,
    });

    return this.toDomain(desk);
  }

  async update(params: UpdateDeskParams): Promise<Desk> {
    const { id, ...data } = params;
    const desk = await this.prisma.desk.update({
      where: {
        id,
      },
      data,
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

  private toDomain(desk: {
    id: string;
    code: string;
    name: string | null;
    locationDescription: string | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Desk {
    return new Desk({
      id: desk.id,
      code: desk.code,
      name: desk.name,
      locationDescription: desk.locationDescription,
      enabled: desk.enabled,
      createdAt: desk.createdAt,
      updatedAt: desk.updatedAt,
      deletedAt: desk.deletedAt,
    });
  }
}
