# Deskly

Aplicacion mobile para la gestion operativa de centros de coworking.

## Tecnologias

- Backend: NestJS
- Mobile: React Native / Expo
- Base de datos: PostgreSQL
- ORM: Prisma
- Documentacion API: Swagger
- Package manager: pnpm

## Arquitectura

El proyecto utiliza una arquitectura hexagonal, tambien conocida como ports and adapters.

La regla principal es que el dominio y los casos de uso no deben depender de frameworks, base de datos ni transporte HTTP. NestJS, Prisma y los controladores HTTP viven en capas externas y actuan como adaptadores.

Capas esperadas:

- `domain`: reglas de negocio, modelos de dominio, contratos y errores propios del negocio.
- `application`: casos de uso, DTOs internos y puertos que necesita la aplicacion.
- `infrastructure`: adaptadores tecnicos como Prisma, persistencia, configuracion, integraciones externas y servicios concretos.
- `interfaces`: entrada y salida hacia usuarios o sistemas externos, por ejemplo controladores HTTP.
- `common`: utilidades transversales acotadas.
- `config`: carga y validacion de variables de entorno.

## Estructura

```text
Deskly-Mobile/
  backend/
  mobile/
  docs/
```

## Backend

```bash
cd backend
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm start:dev
```

El backend requiere `DATABASE_URL` para crear el cliente Prisma. Todavia no existen entidades de dominio; la base actual solo deja lista la conexion y la estructura para incorporar modulos.

## Mobile

```bash
cd mobile
pnpm install
pnpm start
```

## Convenciones de desarrollo

- Cada entidad nueva debe respetar arquitectura hexagonal.
- Los servicios de infraestructura no deben filtrarse hacia el dominio.
- Los cambios backend que agreguen endpoints deben documentar contratos, payloads y errores.
- Las pantallas home deben paginar con 9 items.
- Los historiales de cambios deben paginar con 3 items cuando exista endpoint.
- Los formularios de edicion deben enviar solo diferencias reales.
- No ejecutar commits automaticamente; al finalizar un modulo se debe proponer el mensaje de commit.
