# Backend Deskly

Backend NestJS organizado con arquitectura hexagonal.

## Objetivo actual

El estado inicial del backend deja preparada la conexion con PostgreSQL mediante Prisma sin desarrollar entidades de negocio. Esta base permite empezar a crear modulos manteniendo separacion entre dominio, aplicacion, infraestructura e interfaces.

## Variables de entorno

Crear `.env` desde `.env.example`.

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deskly?schema=public"
JWT_SECRET=change_me_for_local_development
JWT_EXPIRES_IN=1d
```

Variables requeridas:

- `DATABASE_URL`: cadena de conexion PostgreSQL usada por Prisma.
- `JWT_SECRET`: secreto base para futuros modulos de autenticacion.

## Prisma

Archivos principales:

- `prisma/schema.prisma`: definicion del datasource PostgreSQL y generator del cliente Prisma.
- `prisma.config.ts`: configuracion de Prisma CLI y ruta de migraciones.
- `src/infrastructure/database/prisma.service.ts`: adaptador Nest para conectar y desconectar Prisma.
- `src/infrastructure/database/database.module.ts`: modulo global que exporta `PrismaService`.

Comandos:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

El cliente Prisma se genera dentro de `@prisma/client` y no debe editarse manualmente.

## Capas

- `config`: carga y validacion de variables de entorno.
- `common`: utilidades compartidas acotadas.
- `domain`: reglas y modelos de negocio futuros, sin dependencias de Nest ni Prisma.
- `application`: casos de uso futuros y puertos internos.
- `infrastructure`: adaptadores tecnicos como Prisma y servicios externos.
- `interfaces`: controladores HTTP, presenters y contratos de entrada/salida.

## Reglas para nuevos modulos

- Crear un service dedicado, tipos/DTOs, validaciones, permisos y auditoria cuando aplique.
- Mantener Prisma dentro de infraestructura o repositorios adaptadores.
- Evitar que controladores llamen Prisma directamente.
- Documentar endpoints, payloads, reglas de negocio, estados y errores.
- Implementar historial cuando el backend exponga eventos de cambios.
- Usar soft delete cuando la entidad lo requiera.

## Modulos implementados

### Desks

Gestiona escritorios y consulta disponibilidad por fecha y rango horario.

Endpoints:

```http
POST /desk-descriptions
GET /desk-descriptions
POST /amenities
GET /amenities
POST /desks
GET /desks?page=1&limit=9
GET /desks/:id
PATCH /desks/:id
DELETE /desks/:id
GET /desks/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
```

El borrado de escritorios es logico mediante `deleted_at`.
Los escritorios pueden asociarse a una descripcion reutilizable, una zona `A`, `B` o `C`, y amenities.

### Reservations

Crea reservas activas sobre escritorios disponibles. En esta entrega no se contemplan usuarios ni relaciones con miembros.

Endpoint:

```http
POST /reservations
GET /reservations?page=1&limit=9&status=ACTIVE
GET /reservations/:id
PATCH /reservations/:id
PATCH /reservations/:id/cancel
DELETE /reservations/:id
```

La eliminacion de reservas es logica: se cancela la reserva y se conserva trazabilidad.

Documentacion tecnica del modulo:

- `src/modules/reservations/README.md`

Documentacion tecnica del modulo:

- `src/modules/desks/README.md`

## Validacion

Comandos base:

```bash
pnpm build
pnpm test
```
