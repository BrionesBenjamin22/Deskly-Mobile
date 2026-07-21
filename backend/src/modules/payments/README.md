# Modulo Payments

El contrato, los casos de uso y las validaciones de webhooks se detallan en [WEBHOOKS_IMPLEMENTATION.md](./WEBHOOKS_IMPLEMENTATION.md). El endurecimiento, la conciliacion y su matriz de pruebas se documentan en [HARDENING_IMPLEMENTATION.md](./HARDENING_IMPLEMENTATION.md).

## Proveedores de checkout

`PAYMENT_GATEWAY` selecciona el proveedor solo en backend: `FAKE` es el valor por defecto para desarrollo y pruebas; `MERCADO_PAGO` activa el adaptador HTTP de Checkout Pro y exige token, secreto de webhook, URLs de retorno y timeout validos.

El dominio no importa tipos de Mercado Pago. Los secretos no forman parte de DTOs, respuestas ni errores. Las URLs provienen de configuracion backend y deben usar HTTPS en produccion. La preferencia recibe importe ARS calculado en backend, referencia interna, metadata minima, expiracion y `X-Idempotency-Key`.

La consulta externa normaliza estados y compara referencia, importe y moneda contra el intento interno. Un estado desconocido queda `PROCESSING`, nunca `APPROVED`. El retorno visual tampoco aprueba pagos.

Variables: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_SUCCESS_URL`, `MERCADO_PAGO_FAILURE_URL`, `MERCADO_PAGO_PENDING_URL`, `MERCADO_PAGO_ALLOWED_RETURN_ORIGINS` y `MERCADO_PAGO_TIMEOUT_MS`. La allowlist contiene origenes separados por coma. Nunca versionar valores reales.

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
