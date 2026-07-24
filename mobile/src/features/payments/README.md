# Feature Payments

## Proposito

La feature muestra solamente reservas que ya poseen un pago aprobado. Conserva la tarjeta superior de saldo pendiente y permite completar pagos parciales con importes calculados por backend. Inicia un checkout hospedado y solo presenta una confirmacion cuando Deskly devuelve `APPROVED`.

## Componentes y flujo

- `PaymentsScreen`: conserva el estilo de tarjetas, muestra el total pendiente arriba y el desglose total, abonado y saldo de cada reserva. Pagina 9 reservas por vez.
- `usePayments`: carga reservas confirmadas, cotizaciones e intentos; excluye reservas sin pagos aprobados y no suma estados pendientes o rechazados como dinero abonado.
- `payments.service.ts`: concentra cotizacion, checkout, consulta de intento y listado por reserva.
- `payment.types.ts`: estados, opciones, cotizacion e intentos normalizados.

Flujo:

1. Desde Escritorios, el usuario elige seña o pago total antes de confirmar.
2. El backend crea un hold tecnico `PENDING_PAYMENT`; la app solicita inmediatamente su cotizacion y checkout.
3. Se valida que `checkoutUrl` use HTTPS y se abre con `Linking.openURL`.
4. Volver a la app no confirma el pago. Se consulta `GET /payments/:id` hasta recibir un estado terminal o alcanzar el vencimiento informado por backend.
5. Solo `APPROVED` confirma la reserva y se presenta como exito.
6. La pestaña Pagos queda reservada para reservas con un pago aprobado. Si fue una seña, ofrece completar exclusivamente el saldo pendiente.

## Contratos

Cotizacion:

```json
{
  "reservationId": "uuid",
  "currency": "ARS",
  "pricingVersion": "ARS_1500_HOUR_DEPOSIT_30_V1",
  "totalMinorUnits": 600000,
  "approvedMinorUnits": 180000,
  "pendingMinorUnits": 420000,
  "options": [{ "option": "FULL", "amountMinorUnits": 420000 }]
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
- La suite mobile valida bloqueo de doble toque, ausencia de falsa confirmacion y finalizacion del saldo parcial.

## Prueba manual sandbox

La compra sandbox real abrio Checkout Pro y acredito la seña en la cuenta de prueba. El flujo backend diferencia preferencia y pago, correlaciona el webhook con referencia unica y deja la reserva confirmada. Resta verificar visualmente en una ejecucion nueva que el polling prolongado muestre el cartel de exito al volver y que Pagos ofrezca completar el saldo.
