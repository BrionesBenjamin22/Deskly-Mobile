# Modulo Payments

## Funcionalidad

Gestiona intentos de pago autenticados para reservas. El backend calcula importes, conserva el snapshot de precios y coordina la idempotencia antes de invocar al proveedor.

## Contratos HTTP

Todos los endpoints requieren JWT.

```http
POST /payments/checkout
GET /payments/:id
GET /reservations/:id/payments
```

`POST /payments/checkout` exige el header `Idempotency-Key` de 8 a 160 caracteres y acepta solamente:

```json
{
  "reservationId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "option": "DEPOSIT"
}
```

`option` admite `DEPOSIT` para una seña del 30% o `FULL` para el total. No se aceptan monto, moneda, estado, precio, fecha de pago ni identificador de miembro.

## Reglas de negocio

- El miembro se obtiene del JWT y debe ser propietario de la reserva.
- La reserva debe estar en `RESERVED` o `PENDING_PAYMENT`.
- El precio es ARS 1.500 por hora bajo la version `ARS_1500_HOUR_DEPOSIT_30_V1`.
- El checkout crea un hold de 15 minutos y mantiene la reserva en `PENDING_PAYMENT`.
- La creacion del checkout no confirma la reserva ni aprueba el pago.
- Una clave repetida con los mismos datos reutiliza el intento; con datos diferentes devuelve conflicto.
- Un pago aprobado o un checkout vigente incompatible impiden otro intento.
- Un fallo definitivo del proveedor rechaza el intento y libera el hold. Un timeout reintentable conserva la operacion.
- No existe listado global publico ni borrado fisico de pagos.

## Permisos

- `MIEMBRO`: solo pagos de sus propias reservas.
- `ADMIN` y `GESTOR`: consulta operativa de cualquier pago.

## Respuesta de checkout

```json
{
  "paymentId": "2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4",
  "reservationId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "status": "PENDING",
  "option": "DEPOSIT",
  "amountMinorUnits": 180000,
  "currency": "ARS",
  "pricingVersion": "ARS_1500_HOUR_DEPOSIT_30_V1",
  "checkoutUrl": "https://fake-payments.test/checkout/fake-payment-1",
  "expiresAt": "2026-07-20T15:15:00.000Z"
}
```

## Errores

- `400`: payload, UUID o clave de idempotencia invalidos.
- `401`: sesion ausente o invalida.
- `403`: pago o reserva ajenos.
- `404`: pago o reserva inexistentes.
- `409`: reserva no pagable, checkout incompatible, clave reutilizada o proveedor no disponible.
