import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { DeskZone, PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL es obligatoria.');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const localities = [
  ['20000000-0000-4000-8000-000000000001', 'Sede Centro'],
  ['20000000-0000-4000-8000-000000000002', 'Sede Norte'],
  ['20000000-0000-4000-8000-000000000003', 'Sede Costanera'],
] as const;

const areas = [
  ['30000000-0000-4000-8000-000000000001', 'Espacio Colaborativo', 'Area abierta para trabajo en equipo.', localities[0][0]],
  ['30000000-0000-4000-8000-000000000002', 'Sala Silenciosa', 'Area para tareas de concentracion.', localities[0][0]],
  ['30000000-0000-4000-8000-000000000003', 'Laboratorio Digital', 'Espacio para actividades tecnicas.', localities[1][0]],
  ['30000000-0000-4000-8000-000000000004', 'Sala Ejecutiva', 'Area para reuniones y trabajo individual.', localities[1][0]],
] as const;

const desks = [
  ['40000000-0000-4000-8000-000000000001', 'SEED-COL-01', 'Colaborativo 1', 2, areas[0][0], DeskZone.A],
  ['40000000-0000-4000-8000-000000000002', 'SEED-COL-02', 'Colaborativo 2', 4, areas[0][0], DeskZone.A],
  ['40000000-0000-4000-8000-000000000003', 'SEED-SIL-01', 'Silencioso 1', 1, areas[1][0], DeskZone.B],
  ['40000000-0000-4000-8000-000000000004', 'SEED-LAB-01', 'Laboratorio 1', 2, areas[2][0], DeskZone.C],
  ['40000000-0000-4000-8000-000000000005', 'SEED-LAB-02', 'Laboratorio 2', 2, areas[2][0], DeskZone.C],
  ['40000000-0000-4000-8000-000000000006', 'SEED-EJE-01', 'Ejecutivo 1', 1, areas[3][0], DeskZone.B],
] as const;

async function main() {
  for (const [id, name] of localities) {
    await prisma.locality.upsert({
      where: { id },
      update: { name, active: true },
      create: { id, name, active: true },
    });
  }

  for (const [id, name, description, localityId] of areas) {
    await prisma.workArea.upsert({
      where: { id },
      update: { name, description, localityId, active: true },
      create: { id, name, description, localityId, active: true },
    });
  }

  for (const [id, code, name, peopleCapacity, areaId, zone] of desks) {
    await prisma.desk.upsert({
      where: { id },
      update: { code, name, peopleCapacity, areaId, zone, enabled: true, deletedAt: null },
      create: { id, code, name, peopleCapacity, areaId, zone, enabled: true },
    });
  }

  console.log(`Seed completada: ${localities.length} localidades, ${areas.length} areas y ${desks.length} escritorios.`);
}

main()
  .catch((error: unknown) => {
    console.error('No se pudo ejecutar la seed.', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
