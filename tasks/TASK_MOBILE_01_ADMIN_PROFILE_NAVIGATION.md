| Campo          | Contenido                                                              |
| -------------- | ---------------------------------------------------------------------- |
| ID             | `MOBILE-01`                                                            |
| Modulo         | Mobile, autenticacion y navegacion administrativa                      |
| Estado         | `COMPLETADA`                                                           |
| Dependencia    | `ADMIN-01`                                                             |
| Implementacion | `mobile/App.tsx`, `mobile/src/features/auth/screens/ProfileScreen.tsx` |
| Validacion     | TypeScript, tests mobile relevantes, suite mobile y `git diff --check` |

# Navegacion administrativa desde Mi perfil

## Objetivo

Permitir que una cuenta ADMIN vuelva al Panel desde la barra inferior de la
pantalla Mi perfil.

## Contexto inspeccionado

La barra mostraba la pestaña Panel para ADMIN, pero `ProfileScreen` no recibia
ni propagaba `onPressAdminCatalog`. El handler de la pestaña quedaba indefinido
y la pulsacion no modificaba la pantalla activa.

## Riesgos heredados

La navegacion sigue centralizada mediante estado y callbacks en `App.tsx`.

## Alcance

- Propagar el callback del panel desde `App.tsx` hasta `BottomTabBar`.
- Agregar una prueba de regresion que recorra Panel, Mi perfil y Panel.
- Mantener sin cambios los permisos y pestañas visibles por rol.

## Fuera de alcance

- Migrar la navegacion a un router externo.
- Implementar `AuthContext`.
- Cambiar la apariencia de la barra inferior.

## Secuencia test-first

1. Identificar el callback ausente en el flujo ADMIN.
2. Incorporar una prueba de regresion del recorrido.
3. Propagar el callback faltante.
4. Ejecutar la barrera de validacion mobile.

## Criterios de cierre

- Panel responde desde Mi perfil para ADMIN.
- Gestion de usuarios conserva su callback.
- TypeScript y la suite mobile aprueban.
- `git diff --check` aprueba.

## Evidencia

- TypeScript mobile: aprobado.
- Pruebas focales: 2 suites y 7 pruebas aprobadas.
- Suite mobile completa: 20 suites y 74 pruebas aprobadas.
- Export Expo web: aprobado.
- `git diff --check`: aprobado. Mobile no posee script de formato configurado.
- Prueba manual: pendiente de ejecutar por el usuario en Expo Go.

## Mensaje de commit propuesto

`fix(mobile): restaurar navegacion admin desde perfil`
