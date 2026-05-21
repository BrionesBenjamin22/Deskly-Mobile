import { Inject, Injectable } from '@nestjs/common';

import { DeskNotFoundError } from '../../domain/errors/desk-not-found.error';
import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { DeskOutput } from '../dto/desk.output';
import { toDeskOutput } from '../mappers/desk-output.mapper';

@Injectable()
export class GetDeskByIdUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(id: string): Promise<DeskOutput> {
    const desk = await this.deskRepository.findById(id);

    if (!desk) {
      throw new DeskNotFoundError();
    }

    return toDeskOutput(desk);
  }
}
