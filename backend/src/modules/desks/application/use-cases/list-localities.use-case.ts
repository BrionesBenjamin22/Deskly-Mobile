import { Inject, Injectable } from '@nestjs/common';

import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { LocalityOutput } from '../dto/work-area.output';

@Injectable()
export class ListLocalitiesUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  execute(): Promise<LocalityOutput[]> {
    return this.deskRepository.listLocalities(true);
  }
}
