import { Inject, Injectable } from '@nestjs/common';

import { DeskNameAlreadyExistsError } from '../../domain/errors/desk-name-already-exists.error';
import { WorkAreaNotFoundError } from '../../domain/errors/work-area-not-found.error';
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
    if (input.name) {
      const existing = await this.deskRepository.findByName(input.name);
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

    const desk = await this.deskRepository.create({
      ...(input.name ? { name: input.name } : {}),
      ...(input.peopleCapacity ? { peopleCapacity: input.peopleCapacity } : {}),
      ...(input.descriptionId ? { descriptionId: input.descriptionId } : {}),
      ...(input.areaId ? { areaId: input.areaId } : {}),
      ...(input.zone ? { zone: input.zone } : {}),
      ...(input.amenityIds ? { amenityIds: input.amenityIds } : {}),
      enabled: input.enabled ?? true,
    });

    return toDeskOutput(desk);
  }
}
