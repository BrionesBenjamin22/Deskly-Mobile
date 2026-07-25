import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DesksModule } from './modules/desks/desks.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PenaltiesModule } from './modules/penalties/penalties.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 30,
      },
    ]),
    DatabaseModule,
    CommonModule,
    DesksModule,
    ReservationsModule,
    AuthModule,
    PaymentsModule,
    PenaltiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
