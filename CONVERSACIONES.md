# Registro de conversaciones y cambios solicitados

> Organización vigente: las conversaciones están separadas por entrega y
> funcionalidad en [`ia/README.md`](ia/README.md). Este archivo se conserva
> como registro histórico de los primeros cambios.

## Metadatos

- Proyecto: Deskly Mobile
- Ubicacion del registro: raiz del proyecto
- Fecha de creacion: 2026-05-23
- Agente: Codex
- Objetivo: mantener una bitacora consolidada de conversaciones, cambios solicitados, resultados generados, observaciones, decisiones operativas y mensajes de commit sugeridos.

## Criterios operativos vigentes

Este registro toma como base las reglas de trabajo indicadas para el proyecto.

### Navegacion y paginacion

- En edicion, volver siempre al detalle con `successMessage`.
- En alta, volver al home con `successMessage`.
- Las pantallas home deben paginar con un maximo de 9 elementos por pagina.
- Los historiales de cambios deben mostrarse con paginacion de 3 items cuando exista endpoint.

### Detalle de entidades

Toda pantalla de detalle debe contemplar:

- tarjeta principal de datos
- tarjeta `Auditoria`
- tarjeta `Historial de cambios`
- boton `Volver`
- boton `Editar` solo si la entidad esta activa y el rol lo permite

### Formularios

- En edicion se deben enviar solo diferencias reales.
- Si no hay cambios, no se debe llamar al backend.
- Si hay error, mostrar `body.error` o `body.message`.
- Si hay exito, mostrar `successMessage`.
- Las relaciones deben permitir altas y bajas en el mismo formulario sin ejecutar vinculaciones o desvinculaciones innecesarias en cada actualizacion.

### Mensajes UI

- Los mensajes de exito actuales se conservan como estilo base para formularios y funciones del sistema.
- Los mensajes de error del servidor deben presentarse con tono claro, seguro y orientado a la accion, por ejemplo: "Lo sentimos. No pudimos recuperar su informacion, intente nuevamente".

### Alcance por entidad

Cuando cambie el backend de una entidad, se debe actualizar todo el flujo relacionado sin esperar un pedido puntual:

- service
- home
- form
- detalle
- historial si existe endpoint
- documentacion tecnica correspondiente

### Zonas sensibles

No deben modificarse sin pedir permiso:

- layout global
- router principal
- auth
- hooks compartidos
- estilos base
- componentes reutilizables globales

### Seguridad, arquitectura y performance

Toda funcionalidad nueva debe contemplar:

- modularidad y separacion de responsabilidades
- reutilizacion futura y extensibilidad
- desacoplamiento frontend/backend
- versionado de datos y trazabilidad historica
- permisos por rol
- validacion backend y frontend
- auditoria
- soft delete cuando aplique
- proteccion de endpoints criticos
- sanitizacion de inputs
- paginacion y consultas optimizadas
- compatibilidad con Docker, Docker Compose, variables de entorno, healthchecks, CI/CD futuro, proxy reverso, balanceo y cloud deployment

### Commits

- No ejecutar commits automaticamente.
- Por cada modulo actualizado, proponer un mensaje con la estructura:

```text
tipo(scope opcional): descripcion breve
```

## Conversacion documentada: implementacion MVP backend

Existe una bitacora detallada en:

```text
docs/conversacion-agente-implementacion-mvp.md
```

Resumen de cambios solicitados y resultados generados:

### Configuracion Prisma y base de datos

Solicitud:

- Preparar conexion de backend NestJS con Prisma y PostgreSQL.
- Mantener arquitectura hexagonal.

Resultados:

- Se agrego configuracion global de entorno.
- Se agrego validacion minima de variables requeridas.
- Se creo `PrismaService`.
- Se creo `DatabaseModule`.
- Se incorporo `@prisma/client` y `@prisma/adapter-pg`.
- Se agregaron scripts Prisma.
- Se ajusto `start:prod` a `node dist/src/main`.
- Se documento el proceso en README principal y README del backend.

Observaciones:

- Prisma requiere un archivo `.env` real.
- PostgreSQL debe tener credenciales correctas y base creada previamente.
- El cliente Prisma quedo usando `@prisma/client` para evitar problemas de runtime.

Mensaje de commit sugerido:

```text
feat(backend): configurar prisma y base hexagonal
```

### Disponibilidad de escritorios

Solicitud:

- Implementar consulta de disponibilidad segun `TDD-0001`.

Resultado:

- Se agrego el endpoint:

```http
GET /desks/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
```

- Se implementaron entidades y value objects iniciales.
- Se agrego caso de uso `GetAvailableDesksUseCase`.
- Se agrego repositorio Prisma para escritorios.

Observaciones:

- Reservas `ACTIVE` superpuestas bloquean disponibilidad.
- Reservas `CANCELLED` no bloquean disponibilidad.
- Solo escritorios habilitados aparecen como disponibles.

Mensaje de commit sugerido:

```text
feat(reservas): implementar consulta de disponibilidad de escritorios
```

### CRUD de escritorios

Solicitud:

- Completar CRUD de escritorios.

Resultado:

```http
POST /desks
GET /desks?page=1&limit=9
GET /desks/:id
PATCH /desks/:id
DELETE /desks/:id
```

Observaciones:

- El borrado es logico.
- Al eliminar, se setea `enabled=false`.
- Los escritorios eliminados no aparecen en listados, detalle ni disponibilidad.

Mensaje de commit sugerido:

```text
feat(escritorios): implementar crud y disponibilidad
```

### Creacion de reservas

Solicitud:

- Implementar creacion de reservas de escritorio segun `TDD-0002`.
- No contemplar usuarios en esta entrega.

Resultado:

```http
POST /reservations
```

Payload esperado:

```json
{
  "deskId": "uuid",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00"
}
```

Observaciones:

- Se elimino `memberId` del alcance actual.
- Se agrego restriccion PostgreSQL para impedir reservas activas superpuestas.
- Se maneja `404` para escritorio inexistente y `409` para escritorio no disponible.

Mensaje de commit sugerido:

```text
feat(reservas): implementar creacion de reservas de escritorio
```

### CRUD y cancelacion de reservas

Solicitud:

- Completar CRUD de reservas y cancelacion logica.

Resultado:

```http
POST /reservations
GET /reservations?page=1&limit=9&status=ACTIVE
GET /reservations/:id
PATCH /reservations/:id
PATCH /reservations/:id/cancel
DELETE /reservations/:id
```

Observaciones:

- `DELETE /reservations/:id` ejecuta cancelacion logica.
- Solo reservas `ACTIVE` pueden editarse o cancelarse.
- Reservas canceladas no bloquean disponibilidad.

Mensaje de commit sugerido:

```text
feat(reservas): completar crud y cancelacion de reservas
```

### Verificacion de TDD-0003, TDD-0004 y TDD-0005

Solicitud:

- Verificar cobertura de visualizacion de reservas, cancelacion y confirmacion visual.

Resultados:

- `TDD-0003` queda cubierto parcialmente por `GET /reservations?status=ACTIVE` para el alcance sin usuarios.
- `TDD-0004` queda cubierto por `PATCH /reservations/:id/cancel`.
- `TDD-0005` queda cubierto del lado backend con datos suficientes para construir confirmacion visual.

Observaciones:

- Queda pendiente `GET /reservations/me` para una entrega futura con usuarios.
- Quedan pendientes autenticacion, permisos por miembro y relacion de reservas con usuario autenticado.

Mensajes de commit sugeridos:

```text
feat(reservas): completar confirmacion de reserva
```

### Evolucion del modelo de escritorios

Solicitud:

- Agregar descripcion reutilizable para escritorios.
- Agregar zona enumerativa `A`, `B`, `C`.
- Agregar amenities asociados a escritorios.

Resultado:

- Se agrego `DeskZone`.
- Se agrego `DeskDescription`.
- Se agrego `Amenity`.
- Se agrego relacion many-to-many `DeskAmenity`.
- Se adapto el contrato de creacion de escritorios.

Observaciones:

- Se elimino la dependencia de `locationDescription`.
- Se genero migracion con Prisma sin migracion manual, luego de limpiar datos existentes segun indicacion del usuario.

Mensaje de commit sugerido:

```text
feat(escritorios): agregar descripciones reutilizables zonas y amenities
```

### CRUD de catalogos

Solicitud:

- Implementar CRUD para `DeskDescription` y `Amenity`.

Resultado:

```http
POST /desk-descriptions
GET /desk-descriptions
GET /desk-descriptions/:id
PATCH /desk-descriptions/:id
DELETE /desk-descriptions/:id

POST /amenities
GET /amenities
GET /amenities/:id
PATCH /amenities/:id
DELETE /amenities/:id
```

Observaciones:

- Si el elemento no existe, devuelve `404`.
- Si el elemento esta asociado a escritorios, el delete devuelve `409`.
- Las relaciones quedan protegidas por base de datos.

Mensaje de commit sugerido:

```text
feat(escritorios): implementar crud de catalogos
```

## Conversacion actual: crear registro en raiz

Solicitud del usuario:

```text
Podes agregar en la raiz del proyecto un archivo con las conversaciones, con los cambios solicitados, los resultados generados, las observaciones hechas y demas.
```

Resultado generado:

- Se creo este archivo `CONVERSACIONES.md` en la raiz del proyecto.
- Se incorporaron criterios operativos vigentes.
- Se consolido el resumen de la conversacion previa documentada en `docs/conversacion-agente-implementacion-mvp.md`.
- Se agrego una seccion para la solicitud actual.

Observaciones:

- No se modificaron archivos existentes.
- No se ejecuto commit.
- Este archivo puede seguir actualizandose al cierre de cada modulo o conversacion relevante.

Mensaje de commit sugerido:

```text
docs: agregar registro de conversaciones del proyecto
```

## Validaciones realizadas para este cambio

- Se reviso la raiz del proyecto.
- Se verifico la existencia de documentacion previa en `docs`.
- Se creo un archivo nuevo sin reemplazar contenido existente.

## Estado pendiente

- Actualizar este registro cuando se complete un nuevo modulo.
- Mantener sincronizado con documentacion tecnica de `backend` y `mobile`.
- Agregar resultados de pruebas manuales y tests cuando correspondan a cambios funcionales.

## Actualización de Entrega 3 — 31 de julio de 2026

La bitácora `ia/entrega-3/CONVERSACION.md` registra los ajustes E3-32 a E3-36:

- compatibilidad del login con credenciales existentes y ayuda visual;
- aislamiento de errores de Mercado Pago por intento en el resumen;
- borde visible para regresar al panel administrativo;
- penalizaciones del perfil limitadas al rol `MIEMBRO`;
- opciones de reserva de escritorios hasta las `23:00`.

Los cambios se distribuyeron en cinco commits funcionales independientes. Los
archivos locales de seed y demo con datos ficticios quedaron fuera de ellos.
