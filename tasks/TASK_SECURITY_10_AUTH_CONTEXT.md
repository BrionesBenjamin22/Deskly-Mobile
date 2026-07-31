| Campo          | Contenido                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| ID             | `SECURITY-10`                                                             |
| Modulo         | Autenticacion mobile y pantallas autenticadas                             |
| Estado         | `COMPLETADA`                                                              |
| Dependencia    | `SECURITY-09`, `MOBILE-01`                                                |
| Implementacion | `mobile/App.tsx`, `mobile/src/features/auth`, pantallas autenticadas      |
| Validacion     | TypeScript, suite mobile, cobertura, export Expo, Docker y `git diff --check` |

# AuthContext y eliminacion de prop drilling

## Objetivo

Centralizar la sesion autenticada en un `AuthContext` y exponerla mediante un
hook reutilizable, eliminando la propagacion manual de token, usuario y rol.

## Contexto inspeccionado

`App.tsx` mantiene correctamente el ciclo de vida de la sesion, pero entrega
`accessToken`, usuario y rol como props a las pantallas autenticadas. El runtime
de sesion ya notifica los pares renovados y actualiza el estado raiz.

## Riesgos heredados

- La navegacion es state-based y permanece centralizada en `App.tsx`.
- Restauracion, refresh, logout, cambio de cuenta y cambio de contrasena no
  deben cambiar su orden ni mensajes.
- Las pruebas de pantallas actualmente construyen consumidores con props.

## Alcance

- Crear `AuthProvider` y un hook estricto para la sesion autenticada.
- Migrar token, usuario, identificador y rol desde props al contexto.
- Adaptar pruebas mediante un wrapper de sesion.
- Mantener servicios HTTP y hooks de dominio con sus contratos actuales.
- Actualizar documentacion del modulo y conversacion de Entrega 3.

## Fuera de alcance

- Cambiar navegacion, callbacks, tabs, permisos o estados de pantallas.
- Modificar persistencia segura, refresh token o contratos HTTP.
- Migrar a React Navigation.
- Alterar UX/UI o reglas de negocio.

## Secuencia test-first

1. Caracterizar restauracion, rutas por rol y navegacion administrativa.
2. Probar el contrato del provider y hook.
3. Incorporar el provider sin cambiar el ciclo de vida de `App.tsx`.
4. Migrar consumidores por grupos y adaptar sus fixtures.
5. Ejecutar revision independiente y barrera completa.

## Criterios de cierre

- `App.tsx` no propaga token, usuario ni rol a pantallas autenticadas.
- Los consumidores obtienen esos datos desde el hook.
- Navegacion, permisos y ciclo de sesion conservan su comportamiento.
- Toda la barrera automatizada y Docker aprueban.
- La prueba manual queda documentada si depende del usuario.

## Evidencia

- TypeScript mobile aprobado.
- 8 suites y 34 pruebas focales integradas aprobadas.
- Suite completa con cobertura: 21 suites y 77 pruebas aprobadas.
- Suite final luego de caracterizar refresh: 21 suites y 78 pruebas aprobadas.
- `AuthContext`: 100 % de statements, branches, functions y lines.
- Pruebas finales de App, contexto y barra: 3 suites y 11 pruebas aprobadas.
- Export Expo web aprobado.
- Build de imagen Docker mobile aprobado.
- Backend, base y mobile iniciados con healthchecks aprobados.
- `git diff --check` aprobado.
- Revision multiagente independiente sin regresiones bloqueantes.
- Prueba manual diferida para el recorrido del usuario en Expo Go.

## Mensaje de commit propuesto

`refactor(auth): centralizar sesion mobile sin cambiar comportamiento`
