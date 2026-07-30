# Deskly

Aplicación mobile para la gestión operativa de centros de coworking. El
repositorio contiene una API REST en NestJS y una aplicación Expo/React Native,
con PostgreSQL y Prisma como capa de persistencia.

## Estado actual

Deskly se encuentra en una etapa de MVP funcional avanzado. Están integrados los
flujos principales de autenticación, administración, escritorios, áreas de
trabajo, reservas, pagos y penalizaciones.

El flujo de reserva exige un pago antes de confirmar la operación. Mercado Pago
Checkout Pro se integra mediante un adaptador backend y un proveedor fake se
conserva para pruebas deterministas. Una reserva solo pasa a `RESERVED` cuando el
backend verifica un pago `APPROVED`; volver desde el navegador no confirma la
operación por sí solo.

La aplicación mobile funciona en web, emuladores y dispositivos físicos con Expo.
La URL de la API se resuelve por entorno y exige HTTPS en producción. En mobile
nativo la sesión se persiste con SecureStore; en web permanece únicamente en
memoria.

## Módulos

| Módulo                        | Estado                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Autenticación y perfil        | Login, registro, perfil, cambio de contraseña, revocación por versión de token y sesión segura |
| Gestión de usuarios           | Listado, roles, restauración de acceso y baja lógica para `ADMIN`                              |
| Panel administrativo          | CRUD de escritorios, tipos, amenities, localidades y áreas de trabajo                          |
| Escritorios                   | Catálogo, disponibilidad, filtros, capacidad, amenities y ubicación                            |
| Localidades y áreas           | CRUD, dirección, coordenadas, mapa y relaciones activas                                        |
| Reservas                      | Hold previo al pago, ciclo de estados, cancelación, check-in y ordenamiento operativo          |
| Pagos                         | Checkout Pro, seña o pago total, saldo pendiente, webhooks, conciliación e idempotencia        |
| Penalizaciones                | Registro de ausencias, bloqueos y consulta según rol                                           |
| Historial y auditoría visible | Implementación parcial; continúa como trabajo transversal                                      |

## Roles y navegación

La autorización se valida en el backend y la aplicación mobile oculta las
secciones que cada rol no puede utilizar:

- `MIEMBRO`: escritorios, reservas propias, pagos propios y cuenta.
- `GESTOR`: gestión operativa de reservas, check-in, penalizaciones y cuenta.
- `ADMIN`: panel de elementos del sistema, gestión de usuarios y cuenta.

Las restricciones visuales no reemplazan los guards, roles ni controles de
propiedad del backend.

## Pagos

El backend es la fuente autoritativa para importes, moneda, referencia externa y
estado:

- moneda `ARS` y tarifa calculada por backend;
- checkout idempotente mediante `Idempotency-Key`;
- seña del 30 % o pago del total pendiente;
- validación HMAC y anti-replay en webhooks;
- comparación de referencia, importe y moneda antes de aprobar;
- conciliación de pagos pendientes cuando el webhook se demora;
- rate limiting por usuario en checkout y sincronización, y por IP en webhooks;
- timeout y errores externos sanitizados;
- URLs de checkout limitadas a dominios HTTPS de Mercado Pago.

La documentación operativa y de seguridad se encuentra en
[`backend/src/modules/payments`](./backend/src/modules/payments).

## Tecnologías

- Backend: NestJS 11, TypeScript y Swagger.
- Mobile: React Native 0.81 y Expo 54.
- Persistencia: PostgreSQL y Prisma 7.
- Autenticación: JWT, Passport y bcrypt.
- Pagos: Mercado Pago Checkout Pro.
- Pruebas: Jest, Supertest y Testing Library.
- Infraestructura: Docker, Docker Compose y GitHub Actions.
- Package manager: pnpm 10.

## Arquitectura

El backend utiliza arquitectura hexagonal:

- `domain`: entidades, value objects, reglas y puertos;
- `application`: casos de uso, DTOs internos y servicios;
- `infrastructure`: Prisma, gateways y adaptadores externos;
- `interfaces`: controladores HTTP, DTOs y guards;
- `common` y `config`: comportamiento transversal y configuración validada.

El mobile se organiza por features con screens, componentes, hooks, services,
tipos y validaciones. La navegación es state-based y se coordina desde
`mobile/App.tsx`.

## Estructura

```text
Deskly-Mobile/
  backend/
  mobile/
  tasks/
  .github/workflows/
```

`tasks/README.md` es el registro canónico de tareas, dependencias y estado de las
etapas.

## Requisitos previos

Para ejecución manual:

- Node.js 22;
- pnpm 10.33.2 mediante Corepack;
- PostgreSQL 17;
- Git.

Para el entorno integrado:

- Docker Desktop o Docker Engine con Docker Compose v2;
- puertos 3000 y 8081 disponibles;
- puertos 19000, 19001 y 19002 disponibles para Expo cuando correspondan.

Preparación del package manager:

```bash
corepack enable
corepack prepare pnpm@10.33.2 --activate
```

## Configuración por entorno

Los valores reales permanecen fuera de Git. El repositorio incluye plantillas
separadas:

```text
.env.example
backend/.env.development.example
backend/.env.testing.example
backend/.env.production.example
mobile/.env.development.example
mobile/.env.testing.example
mobile/.env.production.example
```

La plantilla raíz corresponde exclusivamente a Docker Compose. Las plantillas
de backend se cargan según `NODE_ENV`: `development`, `testing` o `production`.
El backend busca primero `.env.<entorno>.local`, luego `.env.<entorno>`,
`.env.local` y finalmente `.env`.

Variables backend:

| Variable | Requerida | Propósito |
| -------- | --------- | --------- |
| `NODE_ENV` | No | Entorno; por defecto `development`. |
| `PORT` | No | Puerto HTTP; por defecto `3000`. |
| `FRONTEND_URL` | No | Orígenes CORS separados por coma. |
| `DATABASE_URL` | Sí | Conexión PostgreSQL utilizada por Prisma. |
| `JWT_SECRET` | Sí | Secreto aleatorio de al menos 32 caracteres. |
| `JWT_EXPIRES_IN` | No | Duración `Ns`, `Nm`, `Nh` o `Nd`, máximo 7 días. |
| `PAYMENT_GATEWAY` | No | `FAKE` o `MERCADO_PAGO`; por defecto `FAKE`. |
| `BOOTSTRAP_ADMIN_*` | Solo bootstrap | Credenciales temporales del primer administrador. |
| `MERCADO_PAGO_*` | Según proveedor | Obligatorias únicamente con Mercado Pago activo. |

Variables mobile:

| Variable | Requerida | Propósito |
| -------- | --------- | --------- |
| `EXPO_PUBLIC_API_URL` | Nativo y Docker | URL HTTP/HTTPS del backend, sin credenciales, query o fragmento. |
| `EXPO_PUBLIC_APP_ENV` | No | `development`, `testing` o `production`; producción exige HTTPS. |

No deben incluirse tokens, contraseñas ni secretos en variables `EXPO_PUBLIC_*`,
porque Expo las incorpora al bundle.

### Copia inicial de templates

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.development.example backend/.env.development
Copy-Item mobile/.env.development.example mobile/.env
```

Bash:

```bash
cp .env.example .env
cp backend/.env.development.example backend/.env.development
cp mobile/.env.development.example mobile/.env
```

Después de copiar, reemplazar contraseñas, `JWT_SECRET`, URLs y direcciones IP.
Los archivos destino están ignorados por Git.

## Inicialización manual

### Backend

1. Crear una base PostgreSQL acorde con `DATABASE_URL`.
2. Copiar y completar `backend/.env.development`.
3. Instalar, migrar e iniciar:

```bash
cd backend
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm start:dev
```

La API queda disponible en `http://localhost:3000`; el healthcheck es
`GET /health` y Swagger se expone fuera de producción en `/api`.

Para datos de demostración:

```bash
pnpm prisma:seed
```

Para crear el primer administrador, completar temporalmente
`BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_USERNAME` y
`BOOTSTRAP_ADMIN_PASSWORD`, verificar que la tabla de usuarios esté vacía y
ejecutar:

```bash
pnpm admin:bootstrap
```

Luego retirar esas tres credenciales del archivo local. El bootstrap es
transaccional y se niega a ejecutarse si ya existe algún usuario.

Para crear una migración durante desarrollo:

```bash
pnpm prisma:migrate
```

No utilizar `prisma migrate dev` como comando de despliegue. En testing,
producción y Docker se utiliza `prisma migrate deploy`.

### Mobile

En otra terminal:

```bash
cd mobile
pnpm install --frozen-lockfile
pnpm start
```

Comandos alternativos:

```bash
pnpm android
pnpm ios
pnpm web
```

En un dispositivo físico, `EXPO_PUBLIC_API_URL` debe apuntar a la IP LAN del
equipo, por ejemplo `http://192.168.1.20:3000`. `127.0.0.1` representa al propio
dispositivo. Producción requiere una URL HTTPS.

## Inicialización con Docker Compose

Este es el camino recomendado para una revisión completa. Requiere `.env`,
`backend/.env.development` y una `EXPO_PUBLIC_API_URL` accesible desde el destino
Expo.

```bash
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f backend mobile
```

El entorno:

- ejecuta migraciones antes de iniciar la API;
- mantiene PostgreSQL en una red interna sin publicar su puerto;
- expone el backend en `0.0.0.0:3000` para Expo Go;
- ejecuta procesos con usuarios sin privilegios;
- utiliza filesystems de solo lectura y elimina capacidades Linux;
- fija imágenes oficiales por digest;
- incorpora healthchecks para base, backend y mobile.

El puerto 3000 debe habilitarse solo en redes privadas de desarrollo.

Detener servicios sin borrar PostgreSQL:

```bash
docker compose -f docker-compose.dev.yml stop
```

Retirar contenedores conservando el volumen:

```bash
docker compose -f docker-compose.dev.yml down
```

Eliminar también los datos locales es destructivo y solo debe hacerse cuando se
quiera reinicializar completamente:

```bash
docker compose -f docker-compose.dev.yml down --volumes
```

GitHub Actions no consume el `.env` raíz ni requiere secretos persistentes para
sus validaciones. El workflow levanta una base PostgreSQL efímera, genera un
`JWT_SECRET` temporal y utiliza `PAYMENT_GATEWAY=FAKE`. Las credenciales de
Mercado Pago se configuran exclusivamente en entornos manuales donde el
proveedor real esté activo.

## Seguridad

Controles relevantes:

- DTOs con whitelist y rechazo de campos no declarados;
- guards JWT, roles y controles de propiedad;
- contraseñas hasheadas con bcrypt;
- rate limiting en autenticación y pagos;
- invalidación de sesiones después de cambios críticos;
- secretos limitados al backend y archivos reales de entorno ignorados;
- CORS y HTTPS productivo configurables;
- respuestas y logs sin cuerpos del proveedor ni credenciales;
- acciones de CI fijadas por SHA y sin persistencia de credenciales;
- dependencias productivas auditadas sin vulnerabilidades conocidas al cierre de
  `SECURITY-08`.

En despliegues con varias réplicas, el almacenamiento en memoria del throttler
debe reemplazarse por un backend compartido, por ejemplo Redis.

## Validación

### Backend

```bash
cd backend
pnpm format
pnpm lint
pnpm build
pnpm test -- --runInBand
pnpm test:e2e -- --runInBand
pnpm audit --prod
```

### Mobile

```bash
cd mobile
pnpm run check:expo
pnpm run typecheck
pnpm test -- --runInBand
pnpm run export:web
pnpm audit --prod
```

La barrera más reciente aprobó 51 suites y 299 pruebas backend, 3 suites y
9 pruebas E2E, 19 suites y 71 pruebas mobile, build backend y type-check mobile.
Las auditorías, export web y formato dependen de que la instalación local
contenga todos los binarios fijados por el lockfile.

## CI/CD

GitHub Actions valida cambios backend, mobile, migraciones, auditorías de
dependencias y builds Docker. Las acciones externas y las imágenes utilizadas por
el pipeline están fijadas de forma inmutable.

Los secretos de CI deben configurarse en GitHub; no existen credenciales reales
versionadas.

## Pendientes conocidos

- completar el historial y la auditoría visible en las entidades que todavía no
  exponen el flujo completo;
- finalizar la validación manual integral de Payments en sandbox;
- automatizar la geocodificación de direcciones como evolución del panel
  administrativo;
- incorporar almacenamiento distribuido para rate limiting antes de escalar el
  backend horizontalmente;
- completar la configuración productiva de proxy reverso, TLS, monitoreo y
  despliegue cloud.

La documentación estable de cada módulo está en sus respectivos README. Los
planes ejecutables y tareas pendientes se mantienen exclusivamente en
[`tasks`](./tasks).

## Créditos

Proyecto ideado y desarrollado por Altamirano German, Briones Benjamin, Falco Valentina, Lugo Avril y Williams Ignacio
