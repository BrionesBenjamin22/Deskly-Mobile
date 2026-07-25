import { Module } from '@nestjs/common';

import { CreateAmenityUseCase } from './application/use-cases/create-amenity.use-case';
import { CreateDeskUseCase } from './application/use-cases/create-desk.use-case';
import { CreateDeskDescriptionUseCase } from './application/use-cases/create-desk-description.use-case';
import { DeleteAmenityUseCase } from './application/use-cases/delete-amenity.use-case';
import { DeleteDeskUseCase } from './application/use-cases/delete-desk.use-case';
import { DeleteDeskDescriptionUseCase } from './application/use-cases/delete-desk-description.use-case';
import { GetAmenityByIdUseCase } from './application/use-cases/get-amenity-by-id.use-case';
import { GetDeskByIdUseCase } from './application/use-cases/get-desk-by-id.use-case';
import { GetDeskDescriptionByIdUseCase } from './application/use-cases/get-desk-description-by-id.use-case';
import { GetAvailableDesksUseCase } from './application/use-cases/get-available-desks.use-case';
import { GetAvailableWorkAreasUseCase } from './application/use-cases/get-available-work-areas.use-case';
import { ListAmenitiesUseCase } from './application/use-cases/list-amenities.use-case';
import { ListDeskDescriptionsUseCase } from './application/use-cases/list-desk-descriptions.use-case';
import { ListDesksUseCase } from './application/use-cases/list-desks.use-case';
import { ListLocalitiesUseCase } from './application/use-cases/list-localities.use-case';
import { ListWorkAreasUseCase } from './application/use-cases/list-work-areas.use-case';
import { UpdateAmenityUseCase } from './application/use-cases/update-amenity.use-case';
import { UpdateDeskUseCase } from './application/use-cases/update-desk.use-case';
import { UpdateDeskDescriptionUseCase } from './application/use-cases/update-desk-description.use-case';
import { DESK_CATALOG_REPOSITORY } from './domain/ports/desk-catalog.repository.port';
import { DESK_REPOSITORY } from './domain/ports/desk-repository.port';
import { PrismaDeskCatalogRepository } from './infrastructure/persistence/prisma-desk-catalog.repository';
import { PrismaDeskRepository } from './infrastructure/persistence/prisma-desk.repository';
import { DeskAvailabilityController } from './interfaces/http/desk-availability.controller';
import { DeskCatalogController } from './interfaces/http/desk-catalog.controller';
import { DesksController } from './interfaces/http/desks.controller';
import { WorkAreasController } from './interfaces/http/work-areas.controller';
import { AuthModule } from '../auth/auth.module';
import { LocalitiesService } from './application/services/localities.service';
import { WorkAreasService } from './application/services/work-areas.service';
import { LocalitiesController } from './interfaces/http/localities.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    DeskAvailabilityController,
    DeskCatalogController,
    DesksController,
    LocalitiesController,
    WorkAreasController,
  ],
  providers: [
    CreateAmenityUseCase,
    CreateDeskUseCase,
    CreateDeskDescriptionUseCase,
    DeleteAmenityUseCase,
    DeleteDeskUseCase,
    DeleteDeskDescriptionUseCase,
    GetAmenityByIdUseCase,
    GetDeskByIdUseCase,
    GetDeskDescriptionByIdUseCase,
    GetAvailableDesksUseCase,
    GetAvailableWorkAreasUseCase,
    ListAmenitiesUseCase,
    ListDeskDescriptionsUseCase,
    ListDesksUseCase,
    ListLocalitiesUseCase,
    ListWorkAreasUseCase,
    UpdateAmenityUseCase,
    UpdateDeskUseCase,
    UpdateDeskDescriptionUseCase,
    LocalitiesService,
    WorkAreasService,
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
