import { Inject, Injectable } from '@nestjs/common';

import { DeskCodeAlreadyExistsError } from '../../domain/errors/desk-code-already-exists.error';
import { DeskNotFoundError } from '../../domain/errors/desk-not-found.error';
import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { DeskOutput } from '../dto/desk.output';
import { UpdateDeskInput } from '../dto/update-desk.input';
import { toDeskOutput } from '../mappers/desk-output.mapper';

@Injectable()
export class UpdateDeskUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(input: UpdateDeskInput): Promise<DeskOutput> {
    const desk = await this.deskRepository.findById(input.id);

    if (!desk) {
      throw new DeskNotFoundError();
    }

    if (input.code && input.code !== desk.code) {
      const existingDesk = await this.deskRepository.findByCode(input.code);

      if (existingDesk) {
        throw new DeskCodeAlreadyExistsError();
      }
    }

    const updatedDesk = await this.deskRepository.update(input);

    return toDeskOutput(updatedDesk);
  }
}
