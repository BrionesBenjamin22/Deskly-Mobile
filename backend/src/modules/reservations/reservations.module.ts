import { Module } from '@nestjs/common';

import { DesksModule } from '../desks/desks.module';
import { AuthModule } from '../auth/auth.module';
import { PenaltiesModule } from '../penalties/penalties.module';
import { CancelReservationUseCase } from './application/use-cases/cancel-reservation.use-case';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { GetReservationByIdUseCase } from './application/use-cases/get-reservation-by-id.use-case';
import { ListReservationsUseCase } from './application/use-cases/list-reservations.use-case';
import { UpdateReservationUseCase } from './application/use-cases/update-reservation.use-case';
import { ValidateArrivalUseCase } from './application/use-cases/validate-arrival.use-case';
import { RESERVATION_REPOSITORY } from './domain/ports/reservation-repository.port';
import { PrismaReservationRepository } from './infrastructure/persistence/prisma-reservation.repository';
import { ReservationsController } from './interfaces/http/reservations.controller';

@Module({
  imports: [DesksModule, AuthModule, PenaltiesModule],
  controllers: [ReservationsController],
  providers: [
    CancelReservationUseCase,
    CreateReservationUseCase,
    GetReservationByIdUseCase,
    ListReservationsUseCase,
    UpdateReservationUseCase,
    ValidateArrivalUseCase,
    {
      provide: RESERVATION_REPOSITORY,
      useClass: PrismaReservationRepository,
    },
  ],
  exports: [RESERVATION_REPOSITORY],
})
export class ReservationsModule {}
