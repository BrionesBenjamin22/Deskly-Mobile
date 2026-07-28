import { Inject, Injectable } from '@nestjs/common';

import { DeskNameAlreadyExistsError } from '../../domain/errors/desk-name-already-exists.error';
import { DeskNotFoundError } from '../../domain/errors/desk-not-found.error';
import { WorkAreaNotFoundError } from '../../domain/errors/work-area-not-found.error';
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

    if (input.name) {
      const existing = await this.deskRepository.findByName(
        input.name,
        input.id,
      );
      if (existing) {
        throw new DeskNameAlreadyExistsError();
      }
    }

    if (input.areaId) {
      const area = await this.deskRepository.findWorkAreaById(input.areaId);
      if (!area) {
        throw new WorkAreaNotFoundError();
      }
    }

    const updatedDesk = await this.deskRepository.update(input);

    return toDeskOutput(updatedDesk);
  }
}
