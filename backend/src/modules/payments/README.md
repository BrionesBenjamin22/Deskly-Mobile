# Modulo Payments

## Funcionalidad

Gestion de pagos asociados a reservas de escritorios.

Los pagos son registros financieros vinculados a una reserva específica, permitiendo rastrear todas las transacciones de dinero relacionadas con una reserva.

## Endpoints

```http
POST /payments
GET /payments?page=1&limit=9&reservationId=<uuid>
GET /payments/:id
DELETE /payments/:id
```

## Payload

```json
{
  "reservationId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "date": "2026-06-22",
  "amount": 100.50
}
```

## Respuesta

```json
{
  "paymentId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
  "reservationId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "date": "2026-06-22",
  "amount": 100.50
}
```

Listado:

```json
{
  "payments": [
    {
      "paymentId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
      "reservationId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
      "date": "2026-06-22",
      "amount": 100.50,
      "createdAt": "2026-06-22T10:30:00.000Z",
      "updatedAt": "2026-06-22T10:30:00.000Z"
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

## Reglas de negocio

- La reserva debe existir.
- El monto debe ser mayor a 0.
- La fecha debe tener formato `YYYY-MM-DD`.
- Un pago puede estar asociado a múltiples transacciones en el futuro.
- El pago es un registro de auditoria que no se puede editar, solo crear o eliminar.
- Los listados usan paginacion con 9 items por defecto.

## Validaciones de entrada

Alta de pago:

- `reservationId`: obligatorio y debe ser UUID v4.
- `date`: obligatoria con formato `YYYY-MM-DD` y fecha real.
- `amount`: obligatorio y debe ser mayor a 0.

Listado:

- `page`: entero mayor o igual a 1.
- `limit`: entero entre 1 y 50.
- `reservationId`: opcional, debe ser UUID v4.

Los errores previsibles de formulario deben mostrarse en frontend junto al campo y no deben disparar una peticion. El backend conserva las validaciones como barrera de seguridad, con mensajes especificos por campo para integraciones externas.

## Errores

- `400`: datos invalidos.
- `404`: pago o reserva no encontrada.
