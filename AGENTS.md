# Guia Operativa del Proyecto

## Objetivo

Establecer reglas de trabajo consistentes para acelerar el desarrollo y reducir retrabajo entre frontend y backend.

## 1. Navegacion despues de guardar

Definir una convencion unica para alta y edicion.

Opciones a ajustar:

- En edicion:
  - volver siempre al detalle con `successMessage`
- En alta:
  - volver al home con `successMessage`
  - o ir al detalle recien creado con `successMessage`

Decision del proyecto:

- En edicion:
  - volver siempre al detalle con `successMessage`
- En alta:
  - volver al home con `successMessage`

## 2. Paginacion en homes

Definir si todas las pantallas home deben compartir el mismo criterio.

Opciones a ajustar:

- maximo `9` elementos por pagina
- otro valor
- solo algunas entidades

Decision del proyecto:

- maximo `9` elementos por pagina

## 3. Estructura base de pantallas de detalle

Decision del proyecto:

- tarjeta principal de datos
- tarjeta `Auditoria`
- tarjeta `Historial de cambios`
- boton `Volver`
- boton `Editar` solo si esta activo y el rol lo permite

## 4. Alcance del historial de cambios

Definir que tipo de eventos debe mostrar el historial por entidad.

Opciones a ajustar:

- solo cambios de campos
- cambios de campos + eventos relacionales
- casos especiales por entidad

Decision del proyecto:

- solo cambios de campos
- cambios de campos + eventos relacionales

## 5. Regla de actualizacion en formularios

Definir el comportamiento estandar de los formularios en edicion.

Opciones a ajustar:

- enviar solo los campos modificados
- si no hay cambios, no llamar al backend
- si hay error, mostrar `body.error` o `body.message`
- si hay exito, mostrar `successMessage`

## 6. Convencion de mensajes y textos UI

Definir el estilo textual de la interfaz.

Opciones a ajustar:

- usar tildes y espanol completo
- usar ASCII simple sin tildes
- definir tono de mensajes de exito y error

Decision del proyecto:

- Los mensajes de error del servidor deben aparecer con un estilo similar a: "Lo sentimos! No pudimos recuperar su informacion, intente nuevamente", y ser un llamado a la accion.
- Los mensajes de exito actuales estan bien; todos los formularios y funciones del sistema deben mantener ese estilo.

## 7. Alcance por entidad cuando cambia el backend

Definir que debo actualizar por defecto cuando una entidad cambia en backend.

Opciones a ajustar:

- solo el `service`
- `service` + `home`
- `service` + `form` + `detalle`
- actualizar todo el flujo sin esperar pedido puntual

Decision del proyecto:

- actualizar todo el flujo sin esperar pedido puntual

## 8. Zonas que no deben modificarse sin pedir permiso

Definir areas sensibles del proyecto.

Decision del proyecto:

- layout global
- router principal
- auth
- hooks compartidos
- estilos base
- componentes reutilizables globales

## 9. Manejo de relaciones en formularios

Definir el comportamiento esperado para relaciones como investigadores, becarios, autores, etc.

Opciones a ajustar:

- solo permitir altas nuevas
- permitir altas y bajas en el mismo formulario
- manejar desvinculacion desde detalle
- manejar relaciones desde pantallas separadas

Decision del proyecto:

- Permitir altas y bajas en el mismo formulario, pero sin llamar a la funcion cada vez que se ejecuta la actualizacion; desvinculacion tambien.

## 10. Consumo obligatorio del historial en frontend

Definir si todo historial expuesto por backend debe consumirse en frontend.

Decision del proyecto:

- Si, toda entidad con endpoint de historial debe mostrarlo en detalle, con paginacion de 3 items.

## 11. Coherencia entre frontend y backend

- Si se detecta una incoherencia menor entre frontend y backend que bloquea un flujo, se puede corregir tambien backend sin esperar autorizacion extra, siempre que el cambio sea acotado y consistente con la arquitectura del proyecto.

## 12. Validacion esperada por cada ajuste

Definir que nivel de validacion debe hacerse al terminar un bloque.

Decision del proyecto:

- prueba manual + test backend
- prueba completa al final del modulo

## Regla operativa resumida

Version final del equipo:

- Toda entidad nueva o ajustada debe quedar consistente entre backend y frontend.
- El frontend debe respetar el contrato actual del backend.
- Las pantallas de detalle deben consumir historial de cambios cuando exista endpoint; si no existe, implementarlo.
- Los formularios en edicion deben enviar solo diferencias reales.
- Los mensajes de exito y error deben ser visibles en UI.
- Las decisiones de navegacion y paginacion deben seguir una unica convencion de proyecto: 9 items por home y 3 items de historial de cambios.
- Por cada modulo actualizado necesito realizar un commit. No ejecutes el commit automaticamente; solo entrega el mensaje de commit siguiendo la estructura: `tipo(scope opcional): descripcion breve`.

## 13. Escalabilidad arquitectonica

Toda nueva funcionalidad debe disenarse contemplando:

- modularidad
- separacion de responsabilidades
- reutilizacion futura
- posibilidad de migracion parcial a microservicios
- versionado de datos
- trazabilidad historica
- desacoplamiento frontend/backend
- extensibilidad para nuevos modulos
- Se debe realizar una documentacion en cada carpeta `/frontend` y `/backend` que detalle las funcionalidades, contratos, y demas. Sin emojis.

## 14. Estandarizacion de services

Cada modulo debe poseer:

Frontend:
- service dedicado
- tipos TypeScript
- hooks reutilizables
- validaciones
- manejo uniforme de errores

Backend:
- rutas
- controller
- service
- model
- historial
- permisos

## 15. Seguridad obligatoria

Toda nueva funcionalidad debe contemplar:

- permisos por rol
- validacion backend
- validacion frontend
- auditoria
- soft delete cuando aplique
- proteccion de endpoints criticos
- mensajes seguros
- sanitizacion de inputs
- trazabilidad

## 16. Estandares UX/UI

Toda implementacion debe respetar:

- heuristicas de Nielsen
- consistencia visual
- placeholders
- feedback visible
- prevencion de errores
- accesibilidad basica
- diseno responsive
- minimalismo institucional

## 17. Documentacion tecnica por modulo

Cada modulo debe documentar:

Frontend:
- vistas
- services
- componentes
- hooks
- permisos
- validaciones

Backend:
- endpoints
- payloads
- reglas de negocio
- modelos
- relaciones
- estados
- errores

## 18. Infraestructura y despliegue

Toda nueva implementacion debe mantener compatibilidad con:

- Docker
- Docker Compose
- variables de entorno
- healthchecks
- CI/CD futuro
- proxy reverso
- balanceo
- cloud deployment

## 19. Performance

Toda nueva funcionalidad debe considerar:

- paginacion
- queries optimizadas
- carga diferida
- reutilizacion
- minimizacion de renders
- eficiencia de consultas

## 20. Manejo de errores de autenticacion

Cuando el backend rechaza un login, debe devolver respuestas diferenciadas por caso. No agrupar todos los 401 en un solo mensaje generico.

Casos actuales y sus contratos:

| Caso | HTTP | Campo extra | Valor |
|------|------|-------------|-------|
| Credenciales incorrectas | 401 | — | — |
| Cuenta desactivada por admin | 401 | `errorCode` | `'ACCOUNT_INACTIVE'` |
| Cuenta bloqueada por penalizaciones | 401 | `blockedUntil` | ISO string de la fecha de desbloqueo |

El frontend detecta el caso por la presencia de `errorCode` o `blockedUntil` en el body del error y muestra un `StatusModal` con titulo especifico:
- Credenciales incorrectas: titulo generico
- Cuenta desactivada: "Cuenta desactivada"
- Cuenta bloqueada: "Cuenta bloqueada"

## 21. Clases de error custom en React Native

Las clases que extienden `Error` en React Native pueden fallar con `instanceof` debido a la transpilacion de Babel, que rompe la cadena de prototipo.

Regla obligatoria: toda clase de error custom debe incluir `Object.setPrototypeOf(this, NombreClase.prototype)` en su constructor.

Ademas, la deteccion en los bloques `catch` debe usar doble verificacion:

```typescript
if (error instanceof MiError || (error instanceof Error && error.name === 'MiError')) {
  // manejar
}
```

Esto aplica a todos los errores en `auth.service.ts` y cualquier otro service que defina errores propios.

## 22. Reutilizacion de componentes entre features

Los componentes de UI de una feature pueden reutilizarse en otras features cuando el contrato de props es identico o compatible. No duplicar.

Casos ya aplicados:
- `CalendarPicker` y `DateSelector` de `features/desks/components` reutilizados en `features/reservations/screens/MyReservationsScreen.tsx` para la vista del GESTOR.
- `getDeskDateOptions` de `DateSelector` reutilizado para generar las opciones rapidas de fecha en reservas.

Regla: antes de crear un nuevo componente de calendario, selector de fecha o similares, verificar si ya existe en otra feature.

## 23. Convencion de navegacion en App.tsx

La navegacion es state-based. No se usa React Navigation ni ningun router externo. El estado `currentScreen` en `App.tsx` determina que pantalla se renderiza.

Reglas:
- Toda nueva pantalla debe recibir sus callbacks de navegacion como props.
- Los modales globales (como `ChangePasswordModal`) se renderizan en `App.tsx` y se abren/cierran con estado local en ese nivel.
- El `accessToken` y datos de sesion se pasan como props desde `App.tsx` hacia cada pantalla. No usar Context para esto a menos que se decida migrar.
- Toda nueva pantalla que use `BottomTabBar` debe recibir y propagar `onPressChangePassword`.

## 24. Endpoints implementados por modulo

Referencia actualizada de todos los endpoints REST disponibles.

### Auth (`/auth`)
| Metodo | Ruta | Proteccion | Descripcion |
|--------|------|------------|-------------|
| GET | `/auth/registration-status` | Publica | Indica si el proximo registro requiere datos de miembro |
| POST | `/auth/register` | Publica | Registro de usuario |
| POST | `/auth/login` | Publica | Login, retorna JWT. Diferencia 3 casos de error |
| GET | `/auth/me` | JWT | Usuario autenticado actual |
| PATCH | `/auth/me` | JWT | Actualizar perfil (username, email, fullName, phone) |
| PATCH | `/auth/me/password` | JWT | Cambiar contrasena (valida contrasena actual) |

### Users (`/users`)
| Metodo | Ruta | Proteccion | Descripcion |
|--------|------|------------|-------------|
| GET | `/users` | ADMIN | Listado paginado con busqueda |
| PATCH | `/users/:id/role` | ADMIN | Cambiar rol |
| PATCH | `/users/:id/access` | ADMIN | Restaurar acceso (desbloquear o reactivar) |
| DELETE | `/users/:id` | ADMIN | Baja logica |

### Desks (`/desks`)
| Metodo | Ruta | Proteccion | Descripcion |
|--------|------|------------|-------------|
| GET | `/desks` | Publica | Listado paginado |
| POST | `/desks` | Publica | Crear escritorio |
| GET | `/desks/:id` | Publica | Detalle |
| PATCH | `/desks/:id` | Publica | Editar |
| DELETE | `/desks/:id` | Publica | Eliminar logicamente |
| GET | `/desks/availability` | Publica | Escritorios disponibles por fecha y horario |

### Reservations (`/reservations`)
| Metodo | Ruta | Proteccion | Descripcion |
|--------|------|------------|-------------|
| POST | `/reservations` | MIEMBRO | Crear reserva |
| GET | `/reservations` | JWT | Listar (MIEMBRO ve solo las propias) |
| GET | `/reservations/:id` | Publica | Detalle |
| PATCH | `/reservations/:id` | Publica | Editar |
| PATCH | `/reservations/:id/cancel` | JWT | Cancelar |
| DELETE | `/reservations/:id` | JWT | Cancelar logicamente |
| PATCH | `/reservations/:id/check-in` | GESTOR | Validar llegada |

### Payments (`/payments`)
| Metodo | Ruta | Proteccion | Descripcion |
|--------|------|------------|-------------|
| POST | `/payments` | Publica | Crear pago vinculado a una reserva |
| GET | `/payments` | Publica | Listado paginado |
| GET | `/payments/:id` | Publica | Detalle |
| DELETE | `/payments/:id` | Publica | Eliminar |

### Penalties (`/penalties`)
| Metodo | Ruta | Proteccion | Descripcion |
|--------|------|------------|-------------|
| POST | `/penalties/absence` | GESTOR | Registrar ausencia e infraccion |
| GET | `/penalties` | JWT | Listado (MIEMBRO ve solo las propias) |
| GET | `/penalties/me` | JWT | Penalizaciones activas del usuario actual |

## 25. Cambio de contrasena

El cambio de contrasena sigue el siguiente flujo:

Backend:
- Endpoint: `PATCH /auth/me/password`
- DTO: `currentPassword` (1-72 chars) y `newPassword` (8-72 chars, minimo 1 mayuscula, minimo 1 numero)
- Logica: valida contrasena actual contra hash, hashea la nueva, actualiza en BD
- Errores: `InvalidCurrentPasswordError` → 401; `UserNotFoundError` → 404

Frontend:
- Modal `ChangePasswordModal` renderizado en `App.tsx` (nivel raiz, tiene acceso al token)
- Se abre via callback `onPressChangePassword` propagado desde `App.tsx` → pantalla → `BottomTabBar`
- Validacion en tiempo real: longitud, mayuscula, numero, coincidencia de confirmacion
- Toda nueva pantalla que incorpore `BottomTabBar` debe recibir y propagar `onPressChangePassword`

## 26. Permisos por rol — resumen operativo

| Accion | ADMIN | GESTOR | MIEMBRO |
|--------|-------|--------|---------|
| Ver escritorios | si | si | si |
| Crear/editar/eliminar escritorios | si | si | no |
| Ver disponibilidad | si | si | si |
| Crear reservas | si | si | si (propias) |
| Ver reservas | todas | todas | solo propias |
| Cancelar reservas | si | si | si (propias) |
| Validar llegada (check-in) | no | si | no |
| Registrar ausencia/penalizacion | no | si | no |
| Filtrar reservas por fecha | no | si | no |
| Gestion de usuarios | si | no | no |
| Restaurar acceso de usuarios | si | no | no |
| Ver penalizaciones de otros | si | si | no |
| Ver propias penalizaciones | si | si | si |
| Cambiar contrasena propia | si | si | si |
| Editar perfil propio | no (readonly) | si | si |
