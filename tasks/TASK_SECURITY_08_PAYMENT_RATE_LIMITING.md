# Limitacion de consumo en pagos

| Campo            | Contenido                                                                              |
| ---------------- | -------------------------------------------------------------------------------------- |
| `ID`             | `SECURITY-08`                                                                          |
| `Modulo`         | Backend, Payments                                                                      |
| `Estado`         | `COMPLETADA`                                                                           |
| `Dependencia`    | Auditoria final de seguridad del 25 de julio de 2026                                   |
| `Implementacion` | `backend/src/modules/payments/interfaces/http`, documentacion de Payments              |
| `Validacion`     | Tests unitarios y HTTP de Payments, build, suite backend completa y `git diff --check` |

## Objetivo

Limitar el consumo de endpoints que crean checkouts o sincronizan pagos con el
proveedor externo, sin interferir con las notificaciones legitimas.

## Contexto inspeccionado

Los endpoints de autenticacion poseen limites explicitos, pero Payments solo
exige autenticacion e idempotencia. Cada consulta de un pago pendiente puede
invocar al proveedor.

## Riesgos heredados

- El almacenamiento en memoria del throttler no se comparte entre replicas.
- Un limite demasiado estricto sobre webhooks puede demorar confirmaciones.
- El tracker de pagos autenticados debe aislar usuarios y no depender solo de IP.

## Alcance

- Limitar checkout a 5 solicitudes por minuto y usuario.
- Limitar consultas y sincronizaciones a 30 solicitudes por minuto y usuario.
- Limitar webhooks a 120 solicitudes por minuto e IP.
- Mantener los mensajes seguros del throttler y documentar la futura migracion a
  almacenamiento distribuido.

## Fuera de alcance

- Incorporar Redis u otra dependencia.
- Cambiar contratos de pagos, estados o navegacion.
- Limitar endpoints que no consultan al proveedor.

## Secuencia test-first

1. Probar trackers y metadatos de limites.
2. Incorporar guards y decoradores.
3. Ejecutar tests focalizados.
4. Ejecutar build, suite backend completa y `git diff --check`.

## Criterios de cierre

- Los limites quedan aplicados antes de ejecutar los casos de uso.
- Los usuarios autenticados poseen contadores independientes.
- Los webhooks usan un contador independiente por IP.
- La barrera automatizada completa queda aprobada.

## Evidencia

- Pruebas test-first iniciales: 4 fallos esperados por limites y tracker ausentes.
- Pruebas focalizadas finales: 3 suites y 13 pruebas aprobadas.
- Prueba HTTP aislada: cinco checkouts aceptados y sexto intento rechazado con
  `429`; el caso de uso se ejecuto cinco veces.
- Suite backend completa: 47 suites y 287 pruebas aprobadas.
- Build backend: aprobado.
- ESLint focalizado: aprobado sin errores ni advertencias.
- Base temporal `deskly_test`: creada con las credenciales de testing y 18
  migraciones aplicadas.
- E2E PostgreSQL de Payments: 1 suite y 7 pruebas aprobadas.
- Formato focalizado y `git diff --check`: aprobados.

## Commit propuesto

`fix(pagos): limitar el consumo de operaciones externas`
