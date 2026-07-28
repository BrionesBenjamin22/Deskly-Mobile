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

export const ACTIVE_PENALTIES_TO_BLOCK = 3;
export const BLOCK_DURATION_DAYS = 7;

export function shouldBlockAccount(activePenaltyCount: number): boolean {
  return activePenaltyCount >= ACTIVE_PENALTIES_TO_BLOCK;
}

export function calculateBlockedUntil(registeredAt: Date): Date {
  const blockedUntil = new Date(registeredAt);
  blockedUntil.setDate(blockedUntil.getDate() + BLOCK_DURATION_DAYS);
  return blockedUntil;
}

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
                status: ReservationStatus.RESERVED,
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
            const activePenaltyCount = await transaction.penalty.count({
              where: {
                memberId: params.memberId,
                level: InfractionLevel.PENALTY,
                activeUntil: { gt: params.registeredAt },
              },
            });
            if (shouldBlockAccount(activePenaltyCount)) {
              const blockedUntil = calculateBlockedUntil(params.registeredAt);
              await transaction.user.updateMany({
                where: { member: { id: params.memberId } },
                data: { blockedUntil },
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
    const where: Prisma.PenaltyWhereInput = {
      ...(params.memberId ? { memberId: params.memberId } : {}),
      ...(params.activeOnly
        ? {
            activeUntil: { gt: new Date() },
          }
        : {}),
    };
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
