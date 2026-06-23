# Modulo Reservations

## Funcionalidad

Gestion de reservas sobre escritorios disponibles.

Cada reserva pertenece obligatoriamente a un miembro activo. En el alta, `memberId` se obtiene del JWT y no se acepta desde el cliente. Un miembro puede tener cero o muchas reservas. La respuesta incluye el identificador del miembro y su nombre completo cuando esta disponible.

## Endpoints

```http
POST /reservations
GET /reservations?page=1&limit=9&status=RESERVED
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

El alta y el listado requieren JWT. Los miembros solo pueden crear reservas propias y solo reciben sus propias reservas; gestores y administradores conservan la consulta operativa global.

## Respuesta

```json
{
  "reservationId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
  "deskId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "memberId": "8ae2e38a-300c-4cc1-b6ba-cee270f163f7",
  "memberFullName": "Nombre Apellido",
  "deskCode": "D-01",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00",
  "status": "RESERVED"
}
```

Listado:

```json
{
  "reservations": [
    {
      "reservationId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
      "deskId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
      "memberId": "8ae2e38a-300c-4cc1-b6ba-cee270f163f7",
      "memberFullName": "Nombre Apellido",
      "deskCode": "D-01",
      "deskName": "Escritorio 1",
      "date": "2026-06-01",
      "startTime": "09:00",
      "endTime": "13:00",
      "status": "RESERVED"
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
- El miembro debe existir y tanto su cuenta como su perfil deben estar activos.
- La fecha debe tener formato `YYYY-MM-DD`.
- Los horarios deben tener formato `HH:mm`.
- El horario de fin debe ser posterior al horario de inicio.
- Las reservas `RESERVED` y `ACTIVE` superpuestas bloquean disponibilidad.
- Las reservas `CANCELLED` no bloquean disponibilidad.
- La base de datos impide superposiciones activas para el mismo escritorio mediante constraint GiST.
- Solo se pueden editar o cancelar reservas reservadas.
- El ciclo es `RESERVED` -> `ACTIVE` -> `COMPLETED`.
- La creación exige el pago inicial y registra la reserva como `RESERVED`; la llegada validada por el gestor la lleva a `ACTIVE`.
- Las reservas `ACTIVE` pasan a `COMPLETED` al superar su horario de fin.
- `DELETE /reservations/:id` no elimina fisicamente la reserva; ejecuta cancelacion logica.
- Los listados usan paginacion con 9 items por defecto.

## Validaciones de entrada

Alta de reserva:

- `deskId`: obligatorio y debe ser UUID v4.
- `memberId`: obligatorio, debe ser UUID v4 y corresponder a un miembro activo.
- `date`: obligatoria con formato `YYYY-MM-DD` y fecha real.
- `startTime`: obligatorio con formato `HH:mm`.
- `endTime`: obligatorio con formato `HH:mm`.
- `endTime` debe ser posterior a `startTime`.

Edicion de reserva:

- todos los campos operativos son opcionales
- si se informa `deskId`, debe ser UUID v4
- si se informa `date`, debe cumplir formato `YYYY-MM-DD` y representar una fecha real
- si se informan horarios, deben cumplir formato `HH:mm`
- el rango final resultante debe ser valido
- la reserva debe estar reservada
- el escritorio final debe existir y estar habilitado
- no puede existir una reserva activa superpuesta para el mismo escritorio

Listado:

- `page`: entero mayor o igual a 1.
- `limit`: entero entre 1 y 50.
- `status`: opcional, restringido a `RESERVED`, `ACTIVE`, `COMPLETED` o `CANCELLED`.

Los errores previsibles de formulario deben mostrarse en frontend junto al campo y no deben disparar una peticion. El backend conserva las validaciones como barrera de seguridad, con mensajes especificos por campo para integraciones externas.

## Errores

- `400`: datos invalidos o rango horario invalido.
- `404`: miembro, escritorio o reserva no encontrada.
- `409`: escritorio no disponible, reserva no editable o reserva no cancelable.
