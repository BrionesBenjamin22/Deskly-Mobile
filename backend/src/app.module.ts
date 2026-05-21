import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
