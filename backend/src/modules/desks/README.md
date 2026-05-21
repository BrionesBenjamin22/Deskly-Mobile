# Modulo Desks

## Funcionalidad

Gestion de escritorios y consulta de disponibilidad para una fecha y franja horaria determinada.

## Endpoints

```http
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
  "locationDescription": "Sector principal",
  "enabled": true
}
```

Edicion:

```json
{
  "name": "Escritorio actualizado",
  "enabled": false
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
      "locationDescription": "Sector principal"
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
- El borrado de escritorios es logico mediante `deleted_at`.
- Los escritorios eliminados no aparecen en listados, detalle ni disponibilidad.
- Solo se devuelven escritorios habilitados.
- Las reservas `ACTIVE` superpuestas bloquean disponibilidad.
- Las reservas `CANCELLED` no bloquean disponibilidad.
- Los listados usan paginacion con 9 items por defecto.

## Arquitectura

- `domain`: entidad `Desk`, value objects `ReservationDate` y `TimeSlot`, errores y puerto `DeskRepositoryPort`.
- `application`: casos de uso CRUD y `GetAvailableDesksUseCase`.
- `infrastructure`: adapter `PrismaDeskRepository`.
- `interfaces`: controllers HTTP `DesksController` y `DeskAvailabilityController`.

## Persistencia

Tablas:

- `desks`
- `reservations`

Indices relevantes:

- `desks.enabled, deleted_at`
- `reservations.desk_id, date, status, start_time, end_time`
- `reservations.member_id, date`

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
