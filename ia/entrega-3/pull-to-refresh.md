# Pull-to-refresh nativo

## Objetivo

Permitir que el usuario actualice mediante el gesto nativo las pantallas con
contenido remoto, sin cambiar sus filtros, navegación ni sincronización actual.

## Implementación

- `usePullToRefresh` centraliza el indicador y bloquea gestos simultáneos.
- Áreas, escritorios, reservas, pagos y perfil usan `RefreshControl`.
- Cada pantalla reutiliza su operación de carga existente.
- Perfil actualiza en conjunto los datos del usuario y sus penalizaciones.
- Los `refreshKey` se mantienen para eventos originados en otras pantallas.
- Las cargas de áreas, escritorios y perfil descartan respuestas obsoletas.

## Comportamiento y límites

- El indicador finaliza tanto ante éxito como ante error.
- Los mensajes de error continúan a cargo de cada pantalla.
- No se modificaron contratos HTTP, permisos, paginación ni navegación.
- La disponibilidad del gesto depende del comportamiento nativo del `ScrollView`.

## Validación automatizada

- TypeScript: aprobado.
- Pruebas focales: 5 suites y 23 pruebas aprobadas.
- Suite completa: 22 suites y 84 pruebas aprobadas.
- Export Expo web y build Docker mobile: aprobados.
- Database, backend y mobile: healthchecks aprobados.
- Backend `/health`: HTTP 200.
- Metro `/status`: `packager-status:running`.
- `git diff --check`: aprobado.

## Prueba manual

El entorno queda levantado para que el usuario documente el gesto en un
dispositivo. Esta comprobación visual no sustituye ni bloquea la evidencia
automatizada de la etapa.
