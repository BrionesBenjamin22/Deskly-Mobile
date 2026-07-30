# Refresh token y deuda técnica

## Solicitud y objetivo

Revisar la deuda técnica acumulada al cierre de la Entrega 2 e implementar
primero el refresh token por ser el bloque independiente de menor complejidad.

## Estado previo

- El login entregaba solamente `access_token`.
- Al vencer el JWT era obligatorio iniciar sesión nuevamente.
- Native persistía el access token en SecureStore.
- Web mantenía la sesión únicamente en memoria.
- Los services recibían el token mediante props y llamaban a `fetch`.
- `tokenVersion` ya permitía revocación global.

## Implementación backend

- `POST /auth/refresh`;
- `JWT_REFRESH_SECRET`, separado de `JWT_SECRET`;
- `JWT_REFRESH_EXPIRES_IN`, con máximo de 30 días;
- claim obligatorio `tokenType=refresh`;
- validación de firma, expiración, usuario, miembro, bloqueo y `tokenVersion`;
- nuevo par de access y refresh tokens en login y renovación;
- rate limiting de 20 renovaciones por minuto;
- mensajes `401` seguros sin detalles de firma;
- configuración E2E con secretos efímeros independientes.

## Implementación mobile

- persistencia de access y refresh token en `expo-secure-store`;
- web continúa sin `localStorage`;
- renovación al restaurar una sesión nativa;
- wrapper autenticado compartido para services;
- un único refresh concurrente;
- reintento máximo de una vez después de `401`;
- reemplazo local de tokens renovados;
- eliminación de ambos tokens cuando la renovación es rechazada;
- notificación de cambios de sesión a `App.tsx`.

## Seguridad y límites

- los secretos permanecen únicamente en backend;
- los tokens no se registran en logs ni base de datos;
- `tokenVersion` revoca access y refresh tokens anteriores globalmente;
- no existe administración de sesiones por dispositivo;
- no existe detección persistente de replay por refresh token;
- la evolución multi-sesión queda fuera de esta etapa.

## Validación

- auth/config backend focal: 3 suites y 20 pruebas;
- backend completo: 52 suites y 307 pruebas;
- auth mobile focal: 2 suites y 8 pruebas;
- mobile completo: 20 suites y 73 pruebas;
- E2E con PostgreSQL limpio y 18 migraciones: 3 suites y 10 pruebas;
- build backend, TypeScript, Expo web, Prettier, ESLint y
  `git diff --check`: aprobados.

## Estado de la deuda técnica

| Deuda | Estado | Evidencia |
|---|---|---|
| `AuthContext` y eliminación de prop drilling | `PENDIENTE` | `App.tsx` continúa entregando sesión, rol y callbacks por props. |
| Refresh token | `COMPLETADA` | Renovación backend/mobile, persistencia segura y reintento automático. |
| Pull-to-refresh nativo | `PENDIENTE` | Continúan los contadores `refreshKey`; no existe `RefreshControl`. |
| Cobertura de `JwtAuthGuard` | `MAYORMENTE COMPLETADA` | Mutaciones y operaciones sensibles protegidas; las lecturas públicas requieren una decisión contractual explícita. |

## Complejidad estimada del prop drilling

Complejidad media, estimada entre medio día y un día de trabajo cuidadoso.
Crear el contexto es sencillo; el riesgo está en migrar siete pantallas,
services, hooks, restauración, logout, cambio de cuenta y tests sin romper la
navegación basada en estado ni provocar renders globales innecesarios.

`session-runtime.ts` reduce el trabajo pendiente porque ya centraliza los
cambios de sesión y puede convertirse en la fuente interna del futuro
`AuthContext`.

## Commit ejecutado

`fbc7e5c feat(auth): incorporar renovacion segura de sesion`
