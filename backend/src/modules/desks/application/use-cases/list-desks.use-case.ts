import { Inject, Injectable } from '@nestjs/common';

import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { ListDesksInput } from '../dto/list-desks.input';
import { ListDesksOutput } from '../dto/list-desks.output';
import { toDeskOutput } from '../mappers/desk-output.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 50;

@Injectable()
export class ListDesksUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(input: ListDesksInput): Promise<ListDesksOutput> {
    const page = Math.max(input.page ?? DEFAULT_PAGE, DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(input.limit ?? DEFAULT_LIMIT, DEFAULT_PAGE),
      MAX_LIMIT,
    );
    const result = await this.deskRepository.list({ page, limit });

    return {
      desks: result.desks.map(toDeskOutput),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
