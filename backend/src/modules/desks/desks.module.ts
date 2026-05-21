import { Module } from '@nestjs/common';

import { CreateAmenityUseCase } from './application/use-cases/create-amenity.use-case';
import { CreateDeskUseCase } from './application/use-cases/create-desk.use-case';
import { CreateDeskDescriptionUseCase } from './application/use-cases/create-desk-description.use-case';
import { DeleteDeskUseCase } from './application/use-cases/delete-desk.use-case';
import { GetDeskByIdUseCase } from './application/use-cases/get-desk-by-id.use-case';
import { GetAvailableDesksUseCase } from './application/use-cases/get-available-desks.use-case';
import { ListAmenitiesUseCase } from './application/use-cases/list-amenities.use-case';
import { ListDeskDescriptionsUseCase } from './application/use-cases/list-desk-descriptions.use-case';
import { ListDesksUseCase } from './application/use-cases/list-desks.use-case';
import { UpdateDeskUseCase } from './application/use-cases/update-desk.use-case';
import { DESK_CATALOG_REPOSITORY } from './domain/ports/desk-catalog.repository.port';
import { DESK_REPOSITORY } from './domain/ports/desk-repository.port';
import { PrismaDeskCatalogRepository } from './infrastructure/persistence/prisma-desk-catalog.repository';
import { PrismaDeskRepository } from './infrastructure/persistence/prisma-desk.repository';
import { DeskAvailabilityController } from './interfaces/http/desk-availability.controller';
import { DeskCatalogController } from './interfaces/http/desk-catalog.controller';
import { DesksController } from './interfaces/http/desks.controller';

@Module({
  controllers: [
    DeskAvailabilityController,
    DeskCatalogController,
    DesksController,
  ],
  providers: [
    CreateAmenityUseCase,
    CreateDeskUseCase,
    CreateDeskDescriptionUseCase,
    DeleteDeskUseCase,
    GetDeskByIdUseCase,
    GetAvailableDesksUseCase,
    ListAmenitiesUseCase,
    ListDeskDescriptionsUseCase,
    ListDesksUseCase,
    UpdateDeskUseCase,
    {
      provide: DESK_REPOSITORY,
      useClass: PrismaDeskRepository,
    },
    {
      provide: DESK_CATALOG_REPOSITORY,
      useClass: PrismaDeskCatalogRepository,
    },
  ],
  exports: [DESK_REPOSITORY],
})
export class DesksModule {}
