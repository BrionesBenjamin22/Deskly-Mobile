import { Injectable } from '@nestjs/common';
import {
  InfractionLevel,
  PenaltyType,
  Prisma,
  ReservationStatus,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Penalty } from '../../domain/entities/penalty.entity';
import {
  PenaltyAlreadyExistsError,
  ReservationNotActiveForAbsenceError,
} from '../../domain/errors/penalty.errors';
import {
  ListPenaltiesParams,
  ListPenaltiesResult,
  PenaltyRepositoryPort,
  PenaltyReservationContext,
  RegisterInfractionParams,
} from '../../domain/ports/penalty-repository.port';

@Injectable()
export class PrismaPenaltyRepository implements PenaltyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findReservation(id: string): Promise<PenaltyReservationContext | null> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) return null;
    return {
      id: reservation.id,
      memberId: reservation.memberId,
      date: reservation.date.toISOString().slice(0, 10),
      startTime: reservation.startTime.toISOString().slice(11, 16),
      status: reservation.status,
      checkedInAt: reservation.checkedInAt,
    };
  }

  async register(params: RegisterInfractionParams): Promise<Penalty> {
    try {
      const created = await this.prisma.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.memberId}))`;

          if (params.cancelReservation) {
            const result = await transaction.reservation.updateMany({
              where: {
                id: params.reservationId,
                status: ReservationStatus.ACTIVE,
                checkedInAt: null,
              },
              data: {
                status: ReservationStatus.CANCELLED,
                cancelledAt: params.registeredAt,
              },
            });
            if (result.count !== 1)
              throw new ReservationNotActiveForAbsenceError();
          }

          const periodStart = new Date(params.registeredAt);
          periodStart.setMonth(periodStart.getMonth() - 1);
          const previousInfractions = await transaction.penalty.count({
            where: {
              memberId: params.memberId,
              registeredAt: { gte: periodStart },
            },
          });
          const level =
            previousInfractions === 0
              ? InfractionLevel.WARNING
              : InfractionLevel.PENALTY;

          const penalty = await transaction.penalty.create({
            data: {
              reservationId: params.reservationId,
              memberId: params.memberId,
              registeredById: params.registeredById,
              type: params.type,
              level,
              reason: params.reason,
              registeredAt: params.registeredAt,
              activeUntil: params.activeUntil,
            },
          });

          if (level === InfractionLevel.PENALTY) {
            const activePenalties = await transaction.penalty.findMany({
              where: {
                memberId: params.memberId,
                level: InfractionLevel.PENALTY,
                activeUntil: { gt: params.registeredAt },
              },
              orderBy: { activeUntil: 'asc' },
              select: { activeUntil: true },
            });
            if (activePenalties.length >= 3) {
              await transaction.user.updateMany({
                where: { member: { id: params.memberId } },
                data: { blockedUntil: activePenalties[0].activeUntil },
              });
            }
          }

          return penalty;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.toDomain(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new PenaltyAlreadyExistsError();
      }
      throw error;
    }
  }

  async list(params: ListPenaltiesParams): Promise<ListPenaltiesResult> {
    const where = params.memberId ? { memberId: params.memberId } : {};
    const [penalties, total] = await this.prisma.$transaction([
      this.prisma.penalty.findMany({
        where,
        orderBy: { registeredAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.penalty.count({ where }),
    ]);
    return {
      penalties: penalties.map((penalty) => this.toDomain(penalty)),
      total,
    };
  }

  private toDomain(penalty: {
    id: string;
    reservationId: string;
    memberId: string;
    registeredById: string | null;
    type: PenaltyType;
    level: InfractionLevel;
    reason: string;
    registeredAt: Date;
    activeUntil: Date;
  }): Penalty {
    return new Penalty({ ...penalty });
  }
}
