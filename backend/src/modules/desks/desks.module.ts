import { Module } from '@nestjs/common';

import { CreateDeskUseCase } from './application/use-cases/create-desk.use-case';
import { DeleteDeskUseCase } from './application/use-cases/delete-desk.use-case';
import { GetDeskByIdUseCase } from './application/use-cases/get-desk-by-id.use-case';
import { GetAvailableDesksUseCase } from './application/use-cases/get-available-desks.use-case';
import { ListDesksUseCase } from './application/use-cases/list-desks.use-case';
import { UpdateDeskUseCase } from './application/use-cases/update-desk.use-case';
import { DESK_REPOSITORY } from './domain/ports/desk-repository.port';
import { PrismaDeskRepository } from './infrastructure/persistence/prisma-desk.repository';
import { DeskAvailabilityController } from './interfaces/http/desk-availability.controller';
import { DesksController } from './interfaces/http/desks.controller';

@Module({
  controllers: [DeskAvailabilityController, DesksController],
  providers: [
    CreateDeskUseCase,
    DeleteDeskUseCase,
    GetDeskByIdUseCase,
    GetAvailableDesksUseCase,
    ListDesksUseCase,
    UpdateDeskUseCase,
    {
      provide: DESK_REPOSITORY,
      useClass: PrismaDeskRepository,
    },
  ],
  exports: [DESK_REPOSITORY],
})
export class DesksModule {}
