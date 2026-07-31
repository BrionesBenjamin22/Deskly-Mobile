# AuthContext y eliminacion de prop drilling

## Solicitud

Corregir la navegacion desde Mi perfil para ADMIN y, una vez cerrada esa
correccion, eliminar el prop drilling de autenticacion mediante un enfoque
multiagente. La migracion no debia modificar ningun comportamiento existente.

## Correccion previa de navegacion

Se verifico que `ProfileScreen` mostraba la pestaña Panel pero no propagaba
`onPressAdminCatalog`. Se conecto el callback desde `App.tsx` y se agrego una
prueba que recorre Panel, Mi perfil y Panel.

Commit:

`824bbaf fix(mobile): restaurar navegacion admin desde perfil`

## Restriccion de compatibilidad

Se conservaron sin cambios:

- navegacion state-based y callbacks;
- pestañas visibles y permisos por rol;
- restauracion y persistencia segura;
- refresh token y actualizacion del runtime;
- logout, cambio de cuenta y cambio de contraseña;
- refresh keys, modales y estados internos de cada flujo;
- contratos HTTP y firmas de services.

## Coordinacion multiagente

- auditoria arquitectonica del alcance y riesgos;
- auditoria independiente de pruebas de caracterizacion;
- implementacion separada del provider y del grupo administrativo;
- integracion de pantallas operativas por el orquestador;
- revision independiente final sin ediciones.

## Implementacion

- `AuthProvider` recibe la sesion mantenida por `App.tsx`;
- `useAuth` expone sesion, access token, usuario y rol;
- las pantallas autenticadas y `BottomTabBar` consumen el hook;
- se eliminaron props de token, usuario, rol e identificador de usuario;
- los services y hooks de dominio conservan el token como argumento;
- las pruebas usan un provider y sesiones de prueba reutilizables;
- una renovacion del runtime actualiza el contexto sin cambiar la pestaña activa.

## Validacion

- TypeScript mobile: aprobado;
- pruebas focales integradas: 8 suites y 34 pruebas;
- suite completa con cobertura: 21 suites y 77 pruebas;
- suite final luego de caracterizar refresh: 21 suites y 78 pruebas;
- cobertura de `AuthContext`: 100 %;
- pruebas finales de contexto, App y barra: 3 suites y 11 pruebas;
- export Expo web: aprobado;
- build de imagen Docker mobile: aprobado;
- backend, base de datos y mobile: healthchecks aprobados;
- `git diff --check`: aprobado;
- revision independiente: sin regresiones bloqueantes.

## Prueba manual

Queda disponible el proyecto levantado para que el usuario recorra los flujos
en Expo Go. La prueba manual no se presenta como ejecutada por el agente.
