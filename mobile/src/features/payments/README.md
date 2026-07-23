# Feature Payments

## Proposito

La feature muestra reservas paginadas, intentos de pago autorizados y cotizaciones calculadas por backend. Inicia un checkout hospedado y solo presenta una confirmacion cuando Deskly devuelve `APPROVED`.

## Componentes y flujo

- `PaymentsScreen`: estados de carga, error, vacio, cotizacion, checkout y resultado. Pagina 9 reservas por vez.
- `usePayments`: carga reservas autenticadas y sus intentos sin sumar estados no aprobados como dinero abonado.
- `payments.service.ts`: concentra cotizacion, checkout, consulta de intento y listado por reserva.
- `payment.types.ts`: estados, opciones, cotizacion e intentos normalizados.

Flujo:

1. El usuario crea una reserva sin enviar monto.
2. Payments solicita `GET /reservations/:id/payment-quote`.
3. El usuario elige `DEPOSIT` o `FULL`; no existe monto personalizado.
4. El cliente genera una clave una vez y llama `POST /payments/checkout` sin monto, moneda, miembro o estado.
5. Se valida que `checkoutUrl` use HTTPS y se abre con `Linking.openURL`.
6. Volver a la app no confirma el pago. Se consulta `GET /payments/:id` hasta cinco veces con espera acotada.
7. Solo `APPROVED` se presenta como pago confirmado. Los demas estados permiten actualizar o reintentar.

## Contratos

Cotizacion:

```json
{
  "reservationId": "uuid",
  "currency": "ARS",
  "pricingVersion": "ARS_1500_HOUR_DEPOSIT_30_V1",
  "options": [
    { "option": "DEPOSIT", "amountMinorUnits": 180000 },
    { "option": "FULL", "amountMinorUnits": 600000 }
  ]
}
```

Creacion de checkout:

```http
POST /payments/checkout
Authorization: Bearer <token>
Idempotency-Key: <clave estable por accion>
```

```json
{
  "reservationId": "uuid",
  "option": "DEPOSIT"
}
```

## Seguridad, errores y accesibilidad

- `PaymentServiceError` restaura su prototipo y se detecta tambien por `name`.
- No se guardan tokens externos, firmas, payloads del proveedor ni IDs externos visibles.
- Los botones se deshabilitan durante operaciones y las opciones monetarias provienen de cotizacion backend.
- Los mensajes de error son accionables y no muestran cuerpos internos.
- El checkout usa una URL HTTPS; React Native documenta `Linking.openURL` para URLs web en mobile y web.

## Validaciones automatizadas

- El service agrega JWT y envia un body minimo.
- El service conserva la clave idempotente entregada por la accion.
- Los errores mantienen prototipo y mensaje seguro.
- La suite mobile valida regresiones de escritorios y reservas.

## Pruebas manuales pendientes

La prueba sandbox real requiere credenciales de prueba y frontend ejecutable. Debe verificar apertura web/native, retorno sin falsa confirmacion, webhook firmado, polling y estado final. No fue ejecutada durante desarrollo automatizado.
