import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const rootPath = process.cwd();
const envPath = existsSync(join(rootPath, '.env'))
  ? join(rootPath, '.env')
  : join(rootPath, '.env.example');

config({ path: envPath });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
