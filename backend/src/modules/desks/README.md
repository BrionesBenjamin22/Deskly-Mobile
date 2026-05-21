# Modulo Desks

## Funcionalidad

Gestion de escritorios y consulta de disponibilidad para una fecha y franja horaria determinada.

## Endpoints

```http
POST /desk-descriptions
GET /desk-descriptions
POST /amenities
GET /amenities
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
  "code": "D-01",
  "name": "Escritorio 1",
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

Amenity:

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
      "code": "D-01",
      "name": "Escritorio 1",
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
- El codigo del escritorio debe ser unico.
- La descripcion del escritorio es reutilizable y define la cantidad de personas.
- La zona del escritorio debe ser `A`, `B` o `C`.
- Los amenities representan activos asociados al escritorio.
- El borrado de escritorios es logico mediante `deleted_at`.
- Los escritorios eliminados no aparecen en listados, detalle ni disponibilidad.
- Solo se devuelven escritorios habilitados.
- Las reservas `ACTIVE` superpuestas bloquean disponibilidad.
- Las reservas `CANCELLED` no bloquean disponibilidad.
- Los listados usan paginacion con 9 items por defecto.

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

- `400`: datos invalidos o rango horario invalido.
- `404`: escritorio no encontrado.
- `409`: codigo de escritorio duplicado.

## Validacion

```bash
pnpm prisma:generate
pnpm build
pnpm test
```
