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

El backend requiere `DATABASE_URL` para crear el cliente Prisma. Actualmente incluye modulos de escritorios, catalogos de amenities y reservas, manteniendo dominio, casos de uso, repositorios y controladores separados por responsabilidad.

## Mobile

```bash
cd mobile
pnpm install
pnpm start
```

## Desarrollo con Docker Compose

Copiar `.env.example` como `.env` en la raiz y definir una contrasena local. El
backend sigue leyendo su configuracion de `backend/.env`, pero Compose reemplaza
`DATABASE_URL` para conectarlo a PostgreSQL por la red interna.

```bash
docker compose -f docker-compose.dev.yml up --build
```

El backend queda publicado solo en `127.0.0.1:3000`. Metro/Expo publica los puertos
de desarrollo necesarios para conexiones externas. PostgreSQL no expone puertos al
host y conserva sus datos en el volumen `postgres-data`.

Antes de iniciar el backend, el servicio one-shot `migration` ejecuta
`prisma migrate deploy`. La API solo arranca cuando todas las migraciones versionadas
terminan correctamente; el contenedor no usa `db push` ni genera migraciones nuevas.

Los contenedores de aplicacion eliminan capacidades Linux, impiden escalamiento de
privilegios y usan filesystem de solo lectura con directorios temporales acotados.
Para Expo Go en un dispositivo fisico, configurar `EXPO_PUBLIC_API_URL` con la IP
LAN del equipo antes de construir e iniciar el servicio mobile.

## Convenciones de desarrollo

- Cada entidad nueva debe respetar arquitectura hexagonal.
- Los servicios de infraestructura no deben filtrarse hacia el dominio.
- Los cambios backend que agreguen endpoints deben documentar contratos, payloads y errores.
- Las pantallas home deben paginar con 9 items.
- Los historiales de cambios deben paginar con 3 items cuando exista endpoint.
- Los formularios de edicion deben enviar solo diferencias reales.
- Las validaciones previsibles deben resolverse en frontend con mensajes por campo antes de ejecutar la peticion.
- El backend debe conservar validaciones de tipo y reglas de negocio como barrera de contrato.
- Los mensajes de exito deben ser visibles, concretos y seguir el estilo institucional del sistema.
- La accion de salir no debe mostrarse como boton directo en la barra inferior.
- No ejecutar commits automaticamente; al finalizar un modulo se debe proponer el mensaje de commit.
