# Hardening de CI

| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-06` |
| `Modulo` | Infraestructura, GitHub Actions |
| `Estado` | `COMPLETADA` |
| `Dependencia` | Auditoria integral del 25 de julio de 2026 |
| `Implementacion` | `.github/workflows/ci.yml` |
| `Validacion` | Parseo YAML, referencias inmutables, alcance de secretos y comandos locales equivalentes |

## Objetivo

Reducir el riesgo de cadena de suministro del pipeline y limitar los secretos a
los pasos backend que realmente los necesitan.

## Contexto inspeccionado

El workflow utiliza permisos globales de solo lectura, pero todas las acciones
externas estaban referenciadas por etiquetas movibles. `DATABASE_URL` y
`JWT_SECRET` se exponian como variables globales a todos los jobs, incluidos
mobile, Docker y acciones de terceros.

## Riesgos heredados

- Los SHA fijados deben actualizarse mediante revision explicita cuando se
  adopte una nueva version de cada accion.
- Los E2E dependen de secretos configurados en GitHub y no pueden validarse
  remotamente desde este entorno local.

## Alcance

- Fijar acciones externas a los commits correspondientes a las etiquetas
  oficiales vigentes.
- Fijar el servicio PostgreSQL por digest.
- Deshabilitar persistencia de credenciales en todos los checkouts.
- Retirar secretos del entorno global.
- Entregar credenciales solo a generacion, migraciones y E2E que las requieren.
- Reutilizar los scripts mobile validados por el repositorio.

## Fuera de alcance

- Ejecutar o publicar workflows remotos.
- Rotar secretos de GitHub.
- Agregar nuevas herramientas o acciones.

## Secuencia test-first

1. Inventariar referencias `uses` y variables globales.
2. Resolver etiquetas contra repositorios oficiales.
3. Fijar SHA y reducir alcance de credenciales.
4. Parsear YAML y verificar invariantes de seguridad.
5. Ejecutar comandos locales equivalentes.

## Criterios de cierre

- Ninguna accion externa queda fijada solo por etiqueta.
- Checkout no conserva credenciales.
- JWT y base de datos no se exponen a jobs mobile o Docker.
- El YAML es valido y los comandos equivalentes aprueban.

## Evidencia

- Parseo YAML aprobado: 9 jobs y 33 usos de acciones.
- Las 33 acciones externas usan SHA de 40 caracteres consultados en sus
  repositorios oficiales.
- Los 9 checkouts definen `persist-credentials: false`.
- No existen acciones fijadas solo por una etiqueta de version.
- `DATABASE_URL` y `JWT_SECRET` no existen en el entorno global; sus referencias
  quedaron limitadas a generacion, migracion y pruebas E2E backend.
- `postgres:17-alpine` quedo fijada por digest SHA-256.
- `pnpm prisma:generate`: aprobado con URL ficticia sin conexion.
- Prisma schema: valido mediante el ejecutable local. `pnpm exec prisma` no
  resolvio el binario en Windows, limitacion ya observada en etapas anteriores.
- Los comandos `pnpm run typecheck`, suite mobile y `pnpm run export:web`
  fueron aprobados en `SECURITY-05` y ahora son los comandos reutilizados por CI.
- `git diff --check`: aprobado.

## Commit propuesto

`ci(seguridad): limitar credenciales y fijar acciones por SHA`
