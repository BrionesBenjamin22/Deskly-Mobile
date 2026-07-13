import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
  Reservation,
  ReservationStatusValue,
} from '../../domain/entities/reservation.entity';
import { DeskUnavailableError } from '../../domain/errors/desk-unavailable.error';
import {
  ListReservationsParams,
  ListReservationsResult,
  OverlappingReservationParams,
  ReservationRepositoryPort,
  UpdateReservationParams,
} from '../../domain/ports/reservation-repository.port';

const reservationRelationsInclude = {
  desk: {
    select: {
      code: true,
      name: true,
      area: {
        select: {
          id: true,
          name: true,
          locality: { select: { id: true, name: true } },
        },
      },
    },
  },
  member: { select: { fullName: true } },
} as const;

type ReservationPersistenceRecord = {
  id: string;
  deskId: string;
  memberId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: ReservationStatusValue;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  checkedInAt: Date | null;
  desk: {
    code: string;
    name: string | null;
    area: {
      id: string;
      name: string;
      locality: { id: string; name: string };
    };
  };
  member: { fullName: string };
};

@Injectable()
export class PrismaReservationRepository implements ReservationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async memberExists(memberId: string): Promise<boolean> {
    return (
      (await this.prisma.member.count({
        where: { id: memberId, active: true, user: { active: true } },
      })) > 0
    );
  }

  async existsOverlappingReservation(
    params: OverlappingReservationParams,
  ): Promise<boolean> {
    const count = await this.prisma.reservation.count({
      where: {
        deskId: params.deskId,
        date: this.toDate(params.date),
        status: {
          in: [ReservationStatus.RESERVED, ReservationStatus.ACTIVE],
        },
        startTime: {
          lt: this.toTime(params.endTime),
        },
        endTime: {
          gt: this.toTime(params.startTime),
        },
        ...(params.excludeReservationId
          ? {
              id: {
                not: params.excludeReservationId,
              },
            }
          : {}),
      },
    });

    return count > 0;
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const createdReservation = await this.createReservation(reservation);

    return this.toDomain(createdReservation);
  }

  async list(params: ListReservationsParams): Promise<ListReservationsResult> {
    await this.completeElapsedReservations();
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.date ? { date: this.toDate(params.date) } : {}),
      ...(params.memberId ? { memberId: params.memberId } : {}),
    };
    const [reservations, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        include: reservationRelationsInclude,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      reservations: reservations.map((reservation) =>
        this.toDomain(reservation),
      ),
      total,
    };
  }

  async findById(id: string): Promise<Reservation | null> {
    await this.completeElapsedReservations();
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id,
      },
      include: reservationRelationsInclude,
    });

    return reservation ? this.toDomain(reservation) : null;
  }

  async update(params: UpdateReservationParams): Promise<Reservation> {
    const reservation = await this.updateReservation(params);

    return this.toDomain(reservation);
  }

  async cancel(id: string, cancelledAt: Date): Promise<Reservation> {
    const reservation = await this.prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt,
      },
      include: reservationRelationsInclude,
    });

    return this.toDomain(reservation);
  }

  async validateArrival(
    id: string,
    checkedInAt: Date,
  ): Promise<Reservation | null> {
    const result = await this.prisma.reservation.updateMany({
      where: { id, status: ReservationStatus.RESERVED, checkedInAt: null },
      data: { checkedInAt, status: ReservationStatus.ACTIVE },
    });
    if (result.count !== 1) return this.findById(id);
    return this.findById(id);
  }

  private toDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private async createReservation(
    reservation: Reservation,
  ): Promise<ReservationPersistenceRecord> {
    try {
      return await this.prisma.reservation.create({
        data: {
          deskId: reservation.deskId,
          memberId: reservation.memberId,
          date: this.toDate(reservation.date),
          startTime: this.toTime(reservation.startTime),
          endTime: this.toTime(reservation.endTime),
          status: ReservationStatus.RESERVED,
        },
        include: reservationRelationsInclude,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('reservations_no_active_overlap')
      ) {
        throw new DeskUnavailableError();
      }

      throw error;
    }
  }

  private async updateReservation(
    params: UpdateReservationParams,
  ): Promise<ReservationPersistenceRecord> {
    try {
      return await this.prisma.reservation.update({
        where: {
          id: params.id,
        },
        data: {
          deskId: params.deskId,
          date: this.toDate(params.date),
          startTime: this.toTime(params.startTime),
          endTime: this.toTime(params.endTime),
        },
        include: reservationRelationsInclude,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('reservations_no_active_overlap')
      ) {
        throw new DeskUnavailableError();
      }

      throw error;
    }
  }

  private toTime(value: string): Date {
    return new Date(`1970-01-01T${value}:00.000Z`);
  }

  private fromDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private fromTime(value: Date): string {
    return value.toISOString().slice(11, 16);
  }

  private toDomain(reservation: ReservationPersistenceRecord): Reservation {
    return new Reservation({
      id: reservation.id,
      deskId: reservation.deskId,
      memberId: reservation.memberId,
      memberFullName: reservation.member.fullName,
      deskCode: reservation.desk.code,
      deskName: reservation.desk.name,
      areaId: reservation.desk.area.id,
      areaName: reservation.desk.area.name,
      localityId: reservation.desk.area.locality.id,
      localityName: reservation.desk.area.locality.name,
      date: this.fromDate(reservation.date),
      startTime: this.fromTime(reservation.startTime),
      endTime: this.fromTime(reservation.endTime),
      status: reservation.status,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      cancelledAt: reservation.cancelledAt,
      checkedInAt: reservation.checkedInAt,
    });
  }

  private async completeElapsedReservations(): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "reservations"
      SET "status" = 'COMPLETED'::"ReservationStatus",
          "updated_at" = NOW()
      WHERE "status" = 'ACTIVE'::"ReservationStatus"
        AND ("date" + "end_time") <= timezone('America/Argentina/Buenos_Aires', CURRENT_TIMESTAMP)
    `;
  }
}
