import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { validateEnvironment } from './env.validation';
import { resolveEnvFilePaths } from './env-files';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      expandVariables: true,
      validate: validateEnvironment,
    }),
  ],
})
export class ConfigModule {}
