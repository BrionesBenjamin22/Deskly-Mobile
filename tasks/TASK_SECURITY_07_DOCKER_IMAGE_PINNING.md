# Fijacion de imagenes Docker

| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-07` |
| `Modulo` | Infraestructura, backend y mobile |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-06`; auditoria integral del 25 de julio de 2026 |
| `Implementacion` | `backend/Dockerfile`, `mobile/Dockerfile`, `docker-compose.dev.yml` |
| `Validacion` | Digests oficiales, parseo de Compose, builds Docker, usuarios efectivos, documentacion y `git diff --check` |

## Objetivo

Evitar que una etiqueta mutable cambie silenciosamente las imagenes ejecutadas por
desarrollo y CI, sin perder soporte multi-arquitectura.

## Contexto inspeccionado

Los Dockerfiles backend y mobile utilizaban `node:22-alpine` sin digest. El servicio
PostgreSQL de CI ya estaba fijado, pero `docker-compose.dev.yml` mantenia
`postgres:17-alpine` como etiqueta mutable.

## Riesgos heredados

- Los digests inmutables no reciben actualizaciones automaticamente; deben
  renovarse mediante una revision explicita y periodica.
- La construccion requiere acceso al registro oficial cuando la imagen no existe
  localmente.

## Alcance

- Resolver los manifiestos oficiales de Node.js y PostgreSQL.
- Fijar las referencias por digest multi-arquitectura conservando etiquetas
  legibles.
- Fijar la version exacta de pnpm utilizada por Corepack y CI.
- Verificar las etapas backend `migration` y `runtime`, y mobile `development`.
- Comprobar que los procesos finales mantienen usuarios no privilegiados.
- Documentar el procedimiento de actualizacion.

## Fuera de alcance

- Publicar imagenes.
- Agregar registries, scanners o dependencias.
- Cambiar versiones mayores de Node.js, Alpine o PostgreSQL.
- Modificar la topologia de red o los secretos de Compose.

## Secuencia test-first

1. Inventariar todas las instrucciones `FROM` y referencias `image`.
2. Consultar los manifiestos oficiales sin descargar ni ejecutar imagenes.
3. Fijar digests y comprobar que no queden etiquetas mutables aplicables.
4. Parsear Compose y construir las etapas finales.
5. Inspeccionar usuarios efectivos y ejecutar `git diff --check`.

## Criterios de cierre

- Todas las imagenes oficiales ejecutables quedan fijadas por digest.
- Docker y CI usan la misma version exacta de pnpm.
- Los digests corresponden a manifiestos oficiales multi-arquitectura.
- Compose es valido y las tres etapas Docker construyen.
- Backend y mobile continúan ejecutandose como usuarios no privilegiados.
- La documentacion y el registro canonico reflejan el cambio.

## Evidencia

- Manifiesto oficial `node:22-alpine`: digest multi-arquitectura
  `sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2`.
- Manifiesto oficial `postgres:17-alpine`: digest multi-arquitectura
  `sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193`.
- Comprobacion estructural: cuatro referencias externas fijadas y Compose
  parseado con cuatro servicios.
- Primer build backend: fallo porque Corepack selecciono pnpm 11.17.0 y detecto
  incompatibilidad entre overrides y lockfile. Se fijo pnpm 10.33.2 sin cambiar
  dependencias ni lockfiles.
- Build Docker backend `runtime`: aprobado.
- Build Docker backend `migration`: aprobado.
- Build Docker mobile `development`: aprobado.
- Usuarios efectivos inspeccionados: `deskly`, `migration` y `expo`; ninguno
  ejecuta como root.
- Backend build: aprobado.
- Backend unitarios: 46 suites y 281 pruebas aprobadas.
- Mobile TypeScript: aprobado.
- Mobile: 18 suites y 59 pruebas aprobadas.
- Expo export web: aprobado.
- E2E no aplica a esta etapa porque no cambia persistencia, HTTP ni reglas de
  negocio.
- `git diff --check`: aprobado.

## Commit propuesto

`fix(infra): fijar imagenes Docker por digest`
