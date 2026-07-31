| Campo          | Contenido                                                                    |
| -------------- | ---------------------------------------------------------------------------- |
| ID             | `MOBILE-02`                                                                  |
| Modulo         | Mobile: escritorios, reservas, pagos y perfil                                |
| Estado         | `COMPLETADA`                                                                 |
| Dependencia    | `SECURITY-10`, `MOBILE-01`                                                   |
| Implementacion | `mobile/src/features`, hooks y pantallas con contenido remoto                |
| Validacion     | TypeScript, pruebas focales, suite mobile, export Expo y `git diff --check`   |

# Pull-to-refresh nativo

## Objetivo

Incorporar el gesto nativo pull-to-refresh en las pantallas con contenido
remoto, reutilizando sus operaciones actuales de carga.

## Contexto inspeccionado

Áreas, escritorios, reservas, pagos y penalizaciones del perfil se actualizan
por efectos dependientes de `refreshKey` o funciones de recarga explícitas. Los
contadores externos coordinan eventos entre módulos y deben conservarse.

## Riesgos heredados

- No duplicar solicitudes durante el gesto.
- No reemplazar los `refreshKey` utilizados por eventos cruzados.
- Mantener filtros, paginación, navegación y mensajes actuales.
- Evitar actualizaciones de estado después de desmontar una pantalla.

## Alcance

- Agregar `RefreshControl` a los scrolls principales.
- Exponer recargas asíncronas seguras desde los hooks existentes.
- Mostrar el indicador únicamente durante el gesto manual.
- Probar que cada gesto vuelve a consultar el contenido.
- Corregir el estado documental de `AuthContext` y pull-to-refresh.

## Fuera de alcance

- Cambiar paginación, filtros o contratos HTTP.
- Eliminar recargas externas mediante `refreshKey`.
- Modificar UX/UI fuera del indicador nativo.

## Secuencia test-first

1. Caracterizar las operaciones actuales de carga.
2. Agregar pruebas del gesto en pantallas representativas.
3. Integrar un hook reutilizable para el estado del gesto.
4. Conectar las recargas existentes a `RefreshControl`.
5. Ejecutar la barrera completa y actualizar la documentación.

## Criterios de cierre

- Las cinco vistas permiten el gesto nativo.
- El indicador finaliza tanto en éxito como en error.
- Las recargas externas continúan funcionando.
- TypeScript, pruebas, export Expo y diff aprueban.

## Evidencia

- TypeScript: aprobado.
- Pruebas focales: 5 suites y 23 pruebas aprobadas.
- Suite mobile completa: 22 suites y 84 pruebas aprobadas.
- Export Expo web: aprobado.
- Build de la imagen Docker mobile: aprobado.
- Healthchecks de database, backend y mobile: aprobados.
- Backend `/health`: HTTP 200.
- Metro `/status`: `packager-status:running`.
- `git diff --check`: aprobado.
- Prueba funcional manual en dispositivo: disponible para ejecución por el
  usuario con el entorno levantado.

## Mensaje de commit propuesto

`feat(mobile): incorporar pull-to-refresh nativo`
