import { config as loadEnvironment } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { resolveEnvFilePaths } from '../config/env-files';
import {
  bootstrapAdmin,
  type BootstrapDatabase,
} from '../modules/auth/application/services/bootstrap-admin.service';

async function main(): Promise<void> {
  loadEnvironment({ path: resolveEnvFilePaths(), quiet: true });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL es obligatoria.');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await bootstrapAdmin(
      prisma as unknown as BootstrapDatabase,
      process.env,
    );
    console.log('Administrador inicial creado correctamente.');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? `No se pudo inicializar el administrador: ${error.message}`
      : 'No se pudo inicializar el administrador.',
  );
  process.exitCode = 1;
});
