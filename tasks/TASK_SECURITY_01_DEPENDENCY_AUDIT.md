# Remediacion de dependencias productivas del backend

| Campo | Valor |
|---|---|
| ID | `SECURITY-01` |
| Modulo | Seguridad y dependencias backend |
| Estado | `COMPLETADA` |
| Dependencia | Ninguna; matriz compatible aplicada y validada |
| Implementacion | `backend/package.json`, `backend/pnpm-lock.yaml` y ajustes de compatibilidad necesarios |
| Validacion | `pnpm audit --prod` sin vulnerabilidades, formato, build, suite backend, E2E PostgreSQL, migraciones desde cero y `git diff --check` |

## Objetivo

Remediar las vulnerabilidades productivas detectadas durante la integracion del SDK oficial de Mercado Pago sin degradar contratos HTTP, persistencia, autenticacion ni pagos.

## Contexto inspeccionado

El 21 de julio de 2026, `pnpm audit --prod` informo 33 vulnerabilidades: 8 altas, 23 moderadas y 2 bajas. Las rutas reportadas incluyen dependencias directas o transitivas de `@nestjs/platform-express`, `@nestjs/swagger`, `@prisma/client`, `prisma` y `typeorm`. Entre los paquetes observados se encuentran `multer`, `fast-uri`, `brace-expansion`, `js-yaml`, `hono` y `body-parser`.

El SDK `mercadopago@3.2.0` no declara dependencias transitivas, por lo que no agrega vulnerabilidades a este resultado. El hallazgo es heredado, pero bloquea el cierre estricto de `PAYMENTS-07` por la politica de seguridad del proyecto.

## Riesgos heredados

- Actualizar Nest o Express puede modificar validacion, parsing y manejo global de errores.
- Actualizar Prisma puede alterar generacion de cliente, motor, migraciones o adaptador PostgreSQL.
- Actualizar TypeORM puede afectar codigo heredado aunque Payments use Prisma.
- Usar `overrides` sin verificar compatibilidad puede silenciar el audit y romper comportamiento en runtime.

## Alcance

1. Obtener el reporte JSON completo y clasificar cada advisory por ruta productiva y explotabilidad real.
2. Priorizar actualizaciones directas compatibles; usar overrides solo con evidencia del rango soportado.
3. Incorporar tests de regresion antes de cada grupo de actualizaciones.
4. Repetir la barrera completa despues de cada cambio y al finalizar.
5. Documentar advisories aceptados solo si no existe parche compatible, con mitigacion, responsable y fecha de revision.

## Fuera de alcance

- Cambiar contratos funcionales de Payments.
- Reemplazar Prisma, Nest o TypeORM por otra tecnologia.
- Suprimir el audit o excluir severidades para obtener un resultado artificialmente exitoso.

## Secuencia test-first

1. Congelar evidencia de las suites actuales: backend 40/231 y E2E 2/8.
2. Agregar regresiones para cualquier comportamiento afectado por una actualizacion mayor.
3. Actualizar una familia de dependencias por vez.
4. Ejecutar unitarios focalizados, build y E2E tras cada familia.
5. Ejecutar auditoria, suite completa, migraciones limpias y diff check final.

## Criterios de cierre

- `pnpm audit --prod` no informa vulnerabilidades conocidas.
- No se usan overrides incompatibles o sin justificacion documentada.
- Backend, E2E y migraciones aprueban con cantidades registradas.
- Los endpoints, permisos, errores seguros y contratos de Payments permanecen estables.
- `PAYMENTS-07` deja de depender de este bloqueo.

## Evidencia

Evidencia de cierre del 22 de julio de 2026:

- Baseline confirmado: 33 vulnerabilidades productivas, 8 altas, 23 moderadas y 2 bajas.
- Dependencias directas actualizadas dentro de ramas compatibles: Nest `11.1.28`, Swagger `11.4.6`, Nest TypeORM `11.0.3`, Prisma `7.9.0`, TypeORM `0.3.31` y `pg` `8.22.0`.
- Overrides transitivos acotados a versiones parcheadas de la misma rama: `fast-uri@3.1.0` a `3.1.4` y `brace-expansion@2.1.0` a `2.1.2`.
- `pnpm audit --prod`: 0 vulnerabilidades sobre 372 dependencias productivas.
- Build backend: aprobado con Prisma Client `7.9.0`.
- Suite backend: 40 suites y 231 pruebas aprobadas.
- E2E PostgreSQL: 2 suites y 8 pruebas aprobadas.
- Migraciones desde cero: 17 migraciones aplicadas en `deskly_security_validation_20260722`; base temporal eliminada.
- Formato del archivo modificado `backend/package.json`: aprobado. El chequeo global identifica deuda heredada en 95 archivos ajenos a esta remediacion y no fueron reescritos para evitar ampliar el alcance.
- `git diff --check`: aprobado.

## Commit sugerido

`fix(seguridad): actualizar dependencias vulnerables del backend`
