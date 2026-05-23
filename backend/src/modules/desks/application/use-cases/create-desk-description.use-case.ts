import { Inject, Injectable } from '@nestjs/common';

import { CreateDeskDescriptionInput } from '../dto/create-desk-description.input';
import { DESK_CATALOG_REPOSITORY } from '../../domain/ports/desk-catalog.repository.port';
import type { DeskCatalogRepositoryPort } from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class CreateDeskDescriptionUseCase {
  constructor(
    @Inject(DESK_CATALOG_REPOSITORY)
    private readonly repository: DeskCatalogRepositoryPort,
  ) {}

  execute(input: CreateDeskDescriptionInput) {
    return this.repository.createDescription(input);
  }
}
