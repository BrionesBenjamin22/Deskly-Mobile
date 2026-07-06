import { Inject, Injectable } from '@nestjs/common';

import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { WorkAreaOutput } from '../dto/work-area.output';

type ListWorkAreasInput = {
  localityId?: string;
};

@Injectable()
export class ListWorkAreasUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  execute(input: ListWorkAreasInput): Promise<WorkAreaOutput[]> {
    return this.deskRepository.listWorkAreas({
      localityId: input.localityId,
      activeOnly: true,
    });
  }
}
