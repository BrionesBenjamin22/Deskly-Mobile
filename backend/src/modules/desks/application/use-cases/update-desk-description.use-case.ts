import { Inject, Injectable } from '@nestjs/common';

import { UpdateDeskDescriptionInput } from '../dto/update-desk-description.input';
import { DeskCatalogItemNotFoundError } from '../../domain/errors/desk-catalog-item-not-found.error';
import { DESK_CATALOG_REPOSITORY } from '../../domain/ports/desk-catalog.repository.port';
import type { DeskCatalogRepositoryPort } from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class UpdateDeskDescriptionUseCase {
  constructor(
    @Inject(DESK_CATALOG_REPOSITORY)
    private readonly repository: DeskCatalogRepositoryPort,
  ) {}

  async execute(input: UpdateDeskDescriptionInput) {
    const description = await this.repository.findDescriptionById(input.id);

    if (!description) {
      throw new DeskCatalogItemNotFoundError();
    }

    return this.repository.updateDescription(input);
  }
}
