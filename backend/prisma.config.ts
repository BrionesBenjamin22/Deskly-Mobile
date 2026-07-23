import { config as loadEnvironment } from 'dotenv';
import { defineConfig } from 'prisma/config';

import { resolveEnvFilePaths } from './src/config/env-files';

loadEnvironment({ path: resolveEnvFilePaths(), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
