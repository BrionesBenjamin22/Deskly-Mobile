import { Inject, Injectable } from '@nestjs/common';

import { DESK_CATALOG_REPOSITORY } from '../../domain/ports/desk-catalog.repository.port';
import type { DeskCatalogRepositoryPort } from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class ListDeskDescriptionsUseCase {
  constructor(
    @Inject(DESK_CATALOG_REPOSITORY)
    private readonly repository: DeskCatalogRepositoryPort,
  ) {}

  execute() {
    return this.repository.listDescriptions();
  }
}
