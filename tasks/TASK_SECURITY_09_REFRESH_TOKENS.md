| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-09` |
| `Modulo` | Backend y mobile, autenticación y sesión |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-05`; corrección del pipeline mobile |
| `Implementacion` | `backend/src/modules/auth`, `mobile/src/features/auth`, services mobile |
| `Validacion` | Tests auth backend/mobile, TypeScript, suites completas, build, E2E y `git diff --check` |

# Renovación segura de sesión

## Objetivo

Incorporar un refresh token de mayor duración, validado por backend y
almacenado de forma segura en mobile, y renovar de manera transparente el
access token cuando una operación autenticada recibe `401`.

## Contexto inspeccionado

- El login entrega únicamente un access token.
- `JWT_EXPIRES_IN` admite hasta siete días.
- `tokenVersion` permite revocar tokens al cambiar contraseña o acceso.
- Native persiste el access token en SecureStore; web conserva sesión en memoria.
- Los services usan `fetch` y reciben el token mediante props.

## Riesgos heredados

- El prop drilling permanece fuera de este bloque.
- Una renovación concurrente no debe disparar múltiples requests.
- Un token de renovación inválido, vencido o revocado debe cerrar la sesión.
- Los secretos de firma no deben compartirse ni exponerse al cliente.

## Alcance

- refresh token JWT con secreto y duración independientes;
- claim de tipo y validación de `tokenVersion`;
- endpoint público limitado `POST /auth/refresh`;
- reemisión y reemplazo local del refresh token en cada respuesta;
- persistencia segura nativa y memoria web;
- una sola renovación en vuelo;
- reintento único de la solicitud original;
- cierre local ante renovación rechazada.

## Fuera de alcance

- `AuthContext`;
- múltiples sesiones administrables por usuario;
- lista persistente de revocación por dispositivo;
- cookies web.

## Secuencia test-first

1. Probar emisión y renovación válida.
2. Probar token inválido, tipo incorrecto, usuario inactivo y versión revocada.
3. Probar persistencia y eliminación de ambos tokens.
4. Probar renovación única y reintento.
5. Ejecutar suites focales y completas.

## Criterios de cierre

- access y refresh usan secretos y expiraciones diferenciados;
- el refresh token nunca se persiste en base ni logs;
- `tokenVersion` revoca ambos tipos;
- mobile no guarda tokens en `localStorage`;
- una respuesta `401` se reintenta como máximo una vez;
- todas las validaciones automatizables aprueban.

## Evidencia

- Auth/config focal backend: 3 suites y 20 pruebas aprobadas.
- Backend completo: 52 suites y 307 pruebas aprobadas.
- Mobile focal: 2 suites y 8 pruebas aprobadas.
- Mobile completo: 20 suites y 73 pruebas aprobadas.
- E2E sobre PostgreSQL limpio con 18 migraciones: 3 suites y 10 pruebas.
- Build backend, TypeScript mobile y export Expo web: aprobados.
- Prettier backend y ESLint sin warnings: aprobados.
- `git diff --check`: aprobado.

No existe lista persistente de sesiones o revocación por dispositivo. La
revocación global continúa basada en `tokenVersion`; la detección de replay por
refresh token se reserva para una futura evolución multi-sesión.

## Mensaje de commit propuesto

`feat(auth): incorporar renovacion segura de sesion`
