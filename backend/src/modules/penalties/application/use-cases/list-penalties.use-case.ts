import { Inject, Injectable } from '@nestjs/common';

import { PENALTY_REPOSITORY } from '../../domain/ports/penalty-repository.port';
import type { PenaltyRepositoryPort } from '../../domain/ports/penalty-repository.port';

@Injectable()
export class ListPenaltiesUseCase {
  constructor(
    @Inject(PENALTY_REPOSITORY)
    private readonly repository: PenaltyRepositoryPort,
  ) {}

  async execute(input: {
    memberId?: string;
    page: number;
    limit: number;
    activeOnly?: boolean;
  }) {
    const result = await this.repository.list(input);
    return {
      penalties: result.penalties.map((penalty) => ({
        penaltyId: penalty.id,
        reservationId: penalty.reservationId,
        memberId: penalty.memberId,
        registeredById: penalty.registeredById,
        type: penalty.type,
        level: penalty.level,
        reason: penalty.reason,
        registeredAt: penalty.registeredAt.toISOString(),
        activeUntil: penalty.activeUntil.toISOString(),
        active: penalty.active,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / input.limit),
      },
    };
  }
}
