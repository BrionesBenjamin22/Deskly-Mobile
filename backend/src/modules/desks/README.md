# Modulo Desks

## Funcionalidad

Gestion de escritorios y consulta de disponibilidad para una fecha y franja horaria determinada.

## Endpoints

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
POST /desks
GET /desks?page=1&limit=9
GET /desks/:id
PATCH /desks/:id
DELETE /desks/:id
GET /desks/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
```

## Payloads

Alta:

```json
{
  "name": "Escritorio 1",
  "peopleCapacity": 2,
  "descriptionId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "zone": "A",
  "amenityIds": ["6a3deca2-0063-4e6c-b1ee-a95666b5efdc"],
  "enabled": true
}
```

Edicion:

```json
{
  "name": "Escritorio actualizado",
  "zone": "B",
  "enabled": false
}
```

Descripcion reutilizable:

```json
{
  "name": "Escritorio individual",
  "description": "Escritorio con silla ergonomica",
  "peopleCapacity": 1
}
```

Amenities:

```json
{
  "name": "Monitor"
}
```

Listado:

```json
{
  "desks": [],
  "pagination": {
    "page": 1,
    "limit": 9,
    "total": 0,
    "totalPages": 0
  }
}
```

Disponibilidad:

```json
{
  "desks": [
    {
      "id": "uuid",
      "code": "uuid-generado",
      "name": "Escritorio 1",
      "peopleCapacity": 2,
      "zone": "A",
      "amenities": []
    }
  ]
}
```

Sin disponibilidad:

```json
{
  "desks": []
}
```

## Reglas de negocio

- La fecha es obligatoria y debe tener formato `YYYY-MM-DD`.
- Los horarios son obligatorios y deben tener formato `HH:mm`.
- El horario de fin debe ser posterior al horario de inicio.
- El codigo del escritorio se genera automaticamente como UUID al crear la entidad.
- El usuario no informa ni edita el codigo desde los formularios.
- La cantidad de personas es propia de cada escritorio mediante `peopleCapacity`.
- La descripcion del escritorio es reutilizable y agrupa informacion descriptiva del tipo de escritorio.
- La zona del escritorio debe ser `A`, `B` o `C`.
- Los amenities representan activos asociados al escritorio.
- El borrado de escritorios es logico mediante `deleted_at`.
- Los escritorios eliminados no aparecen en listados, detalle ni disponibilidad.
- Solo se devuelven escritorios habilitados.
- Las reservas `ACTIVE` superpuestas bloquean disponibilidad.
- Las reservas `CANCELLED` no bloquean disponibilidad.
- Los listados usan paginacion con 9 items por defecto.

## Validaciones de entrada

Las validaciones se aplican en DTOs HTTP y se mantienen tambien como reglas de dominio cuando corresponde.

Escritorios:

- `name`: texto opcional, maximo 120 caracteres.
- `peopleCapacity`: entero opcional, minimo 1.
- `descriptionId`: UUID v4 opcional.
- `zone`: valor opcional restringido a `A`, `B` o `C`.
- `amenityIds`: lista opcional, debe enviarse como array de UUID v4 y sin repetidos.
- `enabled`: booleano opcional.

Descripciones reutilizables:

- `name`: texto obligatorio, maximo 120 caracteres.
- `description`: texto opcional, maximo 255 caracteres.
- `peopleCapacity`: entero obligatorio, minimo 1.

Amenities:

- `name`: texto obligatorio, maximo 120 caracteres.

Disponibilidad:

- `date`: obligatoria con formato `YYYY-MM-DD` y fecha real.
- `startTime`: obligatorio con formato `HH:mm`.
- `endTime`: obligatorio con formato `HH:mm`.
- `endTime` debe ser posterior a `startTime`.
- `zone`: opcional restringida a `A`, `B` o `C`.

El frontend debe mostrar los errores previsibles junto al campo correspondiente y evitar la peticion cuando el formulario es invalido. El backend conserva las mismas reglas para proteger el contrato ante integraciones externas.

## Arquitectura

- `domain`: entidad `Desk`, catalogo de descripciones y amenities, value objects `ReservationDate` y `TimeSlot`, errores y puertos.
- `application`: casos de uso CRUD, catalogo y `GetAvailableDesksUseCase`.
- `infrastructure`: adapters `PrismaDeskRepository` y `PrismaDeskCatalogRepository`.
- `interfaces`: controllers HTTP `DesksController`, `DeskCatalogController` y `DeskAvailabilityController`.

## Persistencia

Tablas:

- `desks`
- `desk_descriptions`
- `amenities`
- `desk_amenities`
- `reservations`

Indices relevantes:

- `desks.enabled, deleted_at`
- `desks.description_id`
- `desks.zone`
- `desk_amenities.amenity_id`
- `reservations.desk_id, date, status, start_time, end_time`

## Errores

- `400`: datos invalidos, fecha invalida o rango horario invalido.
- `404`: escritorio o item de catalogo no encontrado.
- `409`: item de catalogo en uso o conflicto de negocio.

## Validacion

```bash
pnpm prisma:generate
pnpm build
pnpm test
```
