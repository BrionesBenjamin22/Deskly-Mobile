# Backend Deskly

Backend NestJS organizado con arquitectura hexagonal y persistencia PostgreSQL mediante Prisma.

## Objetivo actual

El backend expone los contratos necesarios para consultar disponibilidad, gestionar escritorios, administrar catalogos asociados y operar reservas. La implementacion mantiene separacion entre dominio, aplicacion, infraestructura e interfaces para facilitar evolucion modular, trazabilidad y futura extraccion parcial de servicios.

## Variables de entorno

Crear `.env` desde `.env.example`.

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deskly?schema=public"
JWT_SECRET=change_me_for_local_development
JWT_EXPIRES_IN=1h
```

Variables requeridas:

- `DATABASE_URL`: cadena de conexion PostgreSQL usada por Prisma.
- `JWT_SECRET`: secreto de firma para access tokens JWT; debe ser largo, aleatorio y privado.
- `JWT_EXPIRES_IN`: duracion del access token. El valor predeterminado y maximo es `1h`.

`FRONTEND_URL` puede incluir uno o mas origenes separados por coma. En desarrollo, el backend tambien permite origenes locales comunes de Expo web y Vite, ademas de IPs privadas de red local.

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
pnpm prisma:seed
pnpm prisma:studio
```

El cliente Prisma se genera dentro de `@prisma/client` y no debe editarse manualmente.
La seed es idempotente y carga localidades, areas de trabajo y escritorios de demostracion para validar el flujo de disponibilidad y reserva.

## Capas

- `config`: carga y validacion de variables de entorno.
- `common`: utilidades compartidas acotadas.
- `domain`: reglas y modelos de negocio, errores y value objects, sin dependencias de Nest ni Prisma.
- `application`: casos de uso y puertos internos.
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

### Authentication

Registra el primer usuario como `ADMIN` sin miembro y todos los posteriores como `MIEMBRO` con una entidad `Member`. Expone login con email o username, consulta del usuario autenticado y cambio de roles restringido a administradores. Las sesiones son JWT stateless, expiran como maximo en una hora y requieren un nuevo login.

Endpoints:

```http
POST /auth/register
POST /auth/login
GET /auth/registration-status
GET /auth/me
PATCH /users/:id/role
```

Documentacion tecnica: `src/modules/auth/README.md`.

### Desks

Gestiona escritorios y consulta disponibilidad por fecha y rango horario.

Endpoints:

```http
POST /desk-descriptions
GET /desk-descriptions
GET /desk-descriptions/:id
PATCH /desk-descriptions/:id
DELETE /desk-descriptions/:id
POST /amenities
GET /amenities
GET /amenities/:id
PATCH /amenities/:id
DELETE /amenities/:id
POST /desks
GET /desks?page=1&limit=9
GET /desks/:id
PATCH /desks/:id
DELETE /desks/:id
GET /desks/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
```

El borrado de escritorios es logico mediante `deleted_at`.
Los escritorios pueden asociarse a una descripcion reutilizable, una zona `A`, `B` o `C`, y amenities. La disponibilidad devuelve escritorios disponibles y ocupados; cuando existe una reserva activa superpuesta, el escritorio se informa como `unavailable` con la franja reservada.

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

Documentacion tecnica por modulo:

- `src/modules/desks/README.md`
- `src/modules/reservations/README.md`

## Validacion

El backend usa `ValidationPipe` global con:

- `whitelist`
- `forbidNonWhitelisted`
- `transform`
- conversion implicita de tipos
- bloqueo de valores desconocidos

Los DTOs declaran mensajes especificos por campo. El frontend debe prevenir las validaciones previsibles antes de ejecutar la peticion; el backend conserva estas validaciones como barrera de seguridad y como contrato para integraciones externas.

Ejemplos de mensajes esperados:

- `El escritorio debe ser un UUID valido.`
- `La fecha debe tener formato YYYY-MM-DD.`
- `El horario de inicio debe tener formato HH:mm.`
- `El horario de fin debe tener formato HH:mm.`
- `La cantidad de personas debe ser mayor o igual a 1.`
- `Ingrese un nombre valido para el amenity.`
- `Los amenities deben enviarse como una lista.`
- `Los amenities no pueden repetirse.`

Los errores de reglas de negocio se devuelven con codigos HTTP representativos:

- `400`: formato invalido, fecha invalida o rango horario invalido.
- `404`: recurso inexistente o no disponible para la operacion solicitada.
- `409`: conflicto de disponibilidad o estado.

Comandos base:

```bash
pnpm build
pnpm test
```
# Contenedor Docker

El `Dockerfile` usa etapas separadas para instalar dependencias, compilar NestJS y
crear una imagen de ejecucion sin dependencias de desarrollo. La etapa final corre
como el usuario no privilegiado `deskly`, usa `dumb-init` y no incorpora archivos
`.env` al contexto.

La configuracion se inyecta en tiempo de ejecucion. Como minimo requiere
`DATABASE_URL` y `JWT_SECRET`. Las migraciones deben ejecutarse de forma explicita
como tarea de despliegue; el servicio `migration` de Docker Compose ejecuta
`prisma migrate deploy` antes de habilitar la API. El arranque del proceso NestJS no
modifica automaticamente el esquema de datos.

Las etapas base y runtime usan `node:22-alpine` fijada por digest
multi-arquitectura. La etiqueta conserva visible la linea de mantenimiento y el
digest evita cambios de contenido no revisados. Una actualizacion requiere resolver
el nuevo digest oficial y reconstruir las etapas `migration` y `runtime`.
