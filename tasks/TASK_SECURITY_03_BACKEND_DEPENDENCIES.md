# Remediacion vigente de dependencias backend

| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-03` |
| `Modulo` | Backend, dependencias y cadena de suministro |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-01`, auditoria integral del 25 de julio de 2026 |
| `Implementacion` | `backend/package.json`, `backend/pnpm-lock.yaml` |
| `Validacion` | Audit productivo, unitarios, build, migraciones limpias, E2E PostgreSQL y diff check |

## Objetivo

Eliminar los advisories productivos aparecidos despues del cierre de
`SECURITY-01` y reducir dependencias sin uso.

## Contexto inspeccionado

`pnpm audit --prod` informo tres vulnerabilidades altas y una moderada en rutas
de TypeORM, Swagger y tooling transitivo de Prisma. No se encontraron imports
de TypeORM en `src`, `test` ni `prisma`.

## Riesgos heredados

- Los overrides deben retirarse cuando Prisma y Swagger incorporen las
  versiones parcheadas de forma nativa.
- Nuevos advisories pueden aparecer aunque el lockfile no cambie.

## Alcance

- Remover `@nestjs/typeorm` y `typeorm`.
- Retirar 24 paquetes transitivos innecesarios.
- Fijar `find-my-way@9.7.0`, `js-yaml@5.2.2` y `valibot@1.4.2` para las rutas
  vulnerables exactas.
- Conservar el override previo de `fast-uri`.

## Fuera de alcance

- Actualizacion mayor de Nest, Prisma o TypeScript.
- Dependencias de Expo, tratadas en una tarea separada.

## Secuencia test-first

1. Capturar audit y rutas de dependencia.
2. Confirmar ausencia de imports TypeORM.
3. Remover dependencias sin uso.
4. Aplicar overrides parcheados exactos.
5. Repetir audit y barrera completa.

## Criterios de cierre

- Audit productivo sin vulnerabilidades conocidas.
- Build y suite backend sin regresiones.
- Migraciones desde cero y E2E PostgreSQL aprobados.
- Lockfile reproducible con `--frozen-lockfile`.

## Evidencia

- `pnpm audit --prod`: 0 vulnerabilidades sobre 303 dependencias productivas.
- Backend: 46 suites y 281 pruebas aprobadas.
- Build backend aprobado.
- PostgreSQL temporal: 18 migraciones aplicadas desde cero.
- E2E: 3 suites y 9 pruebas aprobadas.
- `git diff --check`: aprobado.
- `pnpm exec prisma validate` no resolvio el binario despues del build en
  Windows; el esquema fue validado mediante `prisma migrate deploy` usando el
  ejecutable local explicito.

## Commit propuesto

`fix(seguridad): remediar dependencias productivas del backend`
