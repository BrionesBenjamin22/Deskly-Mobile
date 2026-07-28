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

## Configuración por entorno

Los valores reales permanecen fuera de Git. El repositorio incluye plantillas
separadas:

```text
backend/.env.development.example
backend/.env.testing.example
backend/.env.production.example
mobile/.env.development.example
mobile/.env.testing.example
mobile/.env.production.example
```

No deben incluirse tokens, contraseñas ni secretos en variables `EXPO_PUBLIC_*`,
porque Expo las incorpora al bundle.

## Ejecución local

### Backend

```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma migrate deploy
pnpm start:dev
```

El backend requiere como mínimo una conexión PostgreSQL y un secreto JWT válidos.
Mercado Pago solo exige sus credenciales cuando `PAYMENT_GATEWAY=MERCADO_PAGO`.

### Mobile

```bash
cd mobile
pnpm install
pnpm start
```

En un dispositivo físico, `EXPO_PUBLIC_API_URL` debe apuntar a la IP LAN del
equipo, por ejemplo `http://192.168.1.20:3000`. `127.0.0.1` representa al propio
dispositivo. Producción requiere una URL HTTPS.

## Docker Compose

Copiar `.env.example` como `.env` en la raíz y completar únicamente los valores
locales requeridos:

```bash
docker compose -f docker-compose.dev.yml up --build
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

La validación más reciente de seguridad y pagos aprobó 47 suites y 287 pruebas
backend, junto con el E2E PostgreSQL de Payments de 1 suite y 7 pruebas. Mobile
aprobó 19 suites y 69 pruebas en su última barrera completa.

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
