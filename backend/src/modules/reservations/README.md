# Modulo Reservations

## Funcionalidad

Gestion de reservas sobre escritorios disponibles.

En esta entrega no se contemplan usuarios ni relacion con miembros. La reserva se asocia solamente al escritorio, fecha, horario y estado.

## Endpoints

```http
POST /reservations
GET /reservations?page=1&limit=9&status=ACTIVE
GET /reservations/:id
PATCH /reservations/:id
PATCH /reservations/:id/cancel
DELETE /reservations/:id
```

## Payload

```json
{
  "deskId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00"
}
```

## Respuesta

```json
{
  "reservationId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
  "deskId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "deskCode": "D-01",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00",
  "status": "ACTIVE"
}
```

Listado:

```json
{
  "reservations": [
    {
      "reservationId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
      "deskId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
      "deskCode": "D-01",
      "deskName": "Escritorio 1",
      "date": "2026-06-01",
      "startTime": "09:00",
      "endTime": "13:00",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 9,
    "total": 1,
    "totalPages": 1
  }
}
```

Cancelacion:

```json
{
  "reservationId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
  "status": "CANCELLED",
  "cancelledAt": "2026-06-01T10:30:00.000Z"
}
```

## Reglas de negocio

- El escritorio debe existir, estar habilitado y no estar eliminado logicamente.
- La fecha debe tener formato `YYYY-MM-DD`.
- Los horarios deben tener formato `HH:mm`.
- El horario de fin debe ser posterior al horario de inicio.
- Las reservas `ACTIVE` superpuestas bloquean disponibilidad.
- Las reservas `CANCELLED` no bloquean disponibilidad.
- La base de datos impide superposiciones activas para el mismo escritorio mediante constraint GiST.
- Solo se pueden editar o cancelar reservas activas.
- `DELETE /reservations/:id` no elimina fisicamente la reserva; ejecuta cancelacion logica.
- Los listados usan paginacion con 9 items por defecto.

## Errores

- `400`: datos invalidos o rango horario invalido.
- `404`: escritorio o reserva no encontrada.
- `409`: escritorio no disponible, reserva no editable o reserva no cancelable.
