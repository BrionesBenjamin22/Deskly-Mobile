import { Inject, Injectable } from '@nestjs/common';

import { DeskNotFoundError } from '../../domain/errors/desk-not-found.error';
import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';

@Injectable()
export class DeleteDeskUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const desk = await this.deskRepository.findById(id);

    if (!desk) {
      throw new DeskNotFoundError();
    }

    await this.deskRepository.softDelete(id);
  }
}
