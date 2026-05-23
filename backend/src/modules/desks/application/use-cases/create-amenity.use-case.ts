import { Inject, Injectable } from '@nestjs/common';

import { CreateAmenityInput } from '../dto/create-amenity.input';
import { DESK_CATALOG_REPOSITORY } from '../../domain/ports/desk-catalog.repository.port';
import type { DeskCatalogRepositoryPort } from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class CreateAmenityUseCase {
  constructor(
    @Inject(DESK_CATALOG_REPOSITORY)
    private readonly repository: DeskCatalogRepositoryPort,
  ) {}

  execute(input: CreateAmenityInput) {
    return this.repository.createAmenity(input);
  }
}
