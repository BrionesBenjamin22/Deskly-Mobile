import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DesksModule } from './modules/desks/desks.module';

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, DesksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
