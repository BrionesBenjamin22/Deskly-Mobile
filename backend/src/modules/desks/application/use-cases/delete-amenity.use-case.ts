import { Inject, Injectable } from '@nestjs/common';

import { DeskCatalogItemNotFoundError } from '../../domain/errors/desk-catalog-item-not-found.error';
import { DESK_CATALOG_REPOSITORY } from '../../domain/ports/desk-catalog.repository.port';
import type { DeskCatalogRepositoryPort } from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class DeleteAmenityUseCase {
  constructor(
    @Inject(DESK_CATALOG_REPOSITORY)
    private readonly repository: DeskCatalogRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const amenity = await this.repository.findAmenityById(id);

    if (!amenity) {
      throw new DeskCatalogItemNotFoundError();
    }

    await this.repository.deleteAmenity(id);
  }
}
