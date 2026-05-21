import { Inject, Injectable } from '@nestjs/common';

import { DeskCodeAlreadyExistsError } from '../../domain/errors/desk-code-already-exists.error';
import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { CreateDeskInput } from '../dto/create-desk.input';
import { DeskOutput } from '../dto/desk.output';
import { toDeskOutput } from '../mappers/desk-output.mapper';

@Injectable()
export class CreateDeskUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(input: CreateDeskInput): Promise<DeskOutput> {
    const existingDesk = await this.deskRepository.findByCode(input.code);

    if (existingDesk) {
      throw new DeskCodeAlreadyExistsError();
    }

    const desk = await this.deskRepository.create({
      code: input.code,
      ...(input.name ? { name: input.name } : {}),
      ...(input.descriptionId ? { descriptionId: input.descriptionId } : {}),
      ...(input.zone ? { zone: input.zone } : {}),
      ...(input.amenityIds ? { amenityIds: input.amenityIds } : {}),
      enabled: input.enabled ?? true,
    });

    return toDeskOutput(desk);
  }
}
