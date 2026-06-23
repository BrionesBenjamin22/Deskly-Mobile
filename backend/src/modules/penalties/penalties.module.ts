import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PenaltyRegistrationService } from './application/services/penalty-registration.service';
import { ListPenaltiesUseCase } from './application/use-cases/list-penalties.use-case';
import { PENALTY_REPOSITORY } from './domain/ports/penalty-repository.port';
import { PrismaPenaltyRepository } from './infrastructure/persistence/prisma-penalty.repository';
import { PenaltiesController } from './interfaces/http/penalties.controller';

@Module({
  imports: [AuthModule],
  controllers: [PenaltiesController],
  providers: [
    PenaltyRegistrationService,
    ListPenaltiesUseCase,
    { provide: PENALTY_REPOSITORY, useClass: PrismaPenaltyRepository },
  ],
  exports: [PenaltyRegistrationService],
})
export class PenaltiesModule {}
