import { Inject, Injectable } from '@nestjs/common';

import { UpdateAmenityInput } from '../dto/update-amenity.input';
import { DeskCatalogItemNotFoundError } from '../../domain/errors/desk-catalog-item-not-found.error';
import { DESK_CATALOG_REPOSITORY } from '../../domain/ports/desk-catalog.repository.port';
import type { DeskCatalogRepositoryPort } from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class UpdateAmenityUseCase {
  constructor(
    @Inject(DESK_CATALOG_REPOSITORY)
    private readonly repository: DeskCatalogRepositoryPort,
  ) {}

  async execute(input: UpdateAmenityInput) {
    const amenity = await this.repository.findAmenityById(input.id);

    if (!amenity) {
      throw new DeskCatalogItemNotFoundError();
    }

    return this.repository.updateAmenity(input);
  }
}
