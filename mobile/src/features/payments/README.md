# Feature Payments

## Proposito

La feature muestra solamente reservas que ya poseen un pago aprobado. Conserva la tarjeta superior de saldo pendiente y permite completar pagos parciales con importes calculados por backend. Inicia un checkout hospedado y solo presenta una confirmacion cuando Deskly devuelve `APPROVED`.

## Componentes y flujo

- `PaymentsScreen`: conserva el estilo de tarjetas, muestra el total pendiente arriba y el desglose total, abonado y saldo de cada reserva. Pagina 9 reservas por vez.
- `usePayments`: carga reservas `PENDING_PAYMENT`, `RESERVED` y `ACTIVE`, sincroniza primero sus intentos y luego solicita la cotizacion actualizada; excluye reservas sin pagos aprobados y no suma estados pendientes o rechazados como dinero abonado.
- `payments.service.ts`: concentra cotizacion, checkout, consulta de intento y listado por reserva.
- `payment.types.ts`: estados, opciones, cotizacion e intentos normalizados.

Flujo:

1. Desde Escritorios, el usuario elige seña o pago total antes de confirmar.
2. El backend crea un hold tecnico `PENDING_PAYMENT`; la app solicita inmediatamente su cotizacion y checkout.
3. Se valida que `checkoutUrl` use HTTPS y se abre con `Linking.openURL`.
4. Las URLs de retorno abren una pagina backend que permite cerrar el checkout. Volver a la app no confirma el pago: se consulta `GET /payments/:id` hasta recibir un estado terminal o alcanzar el vencimiento informado por backend.
5. Solo `APPROVED` confirma la reserva y se presenta como exito.
6. Si el webhook no llego, las consultas autenticadas permiten que backend recupere el pago por referencia externa, lo valide y actualice la reserva.
7. La pestaña Pagos queda reservada visualmente para reservas con un pago aprobado. Incluye temporalmente reservas pendientes durante la sincronizacion; si fue una seña, ofrece completar exclusivamente el saldo pendiente.
8. Durante la espera el loader permanece animado. `Dejar de esperar` cierra solamente el modal bloqueante: la verificacion continua en segundo plano y muestra una confirmacion breve si el pago resulta aprobado.

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
- `Dejar de esperar` no cancela, rechaza ni reembolsa la operacion externa.
- La navegacion oculta la seccion Pagos para `ADMIN`, porque ese rol no posee acciones de cobro. `MIEMBRO` conserva el acceso y `GESTOR` mantiene su navegacion operativa reducida.
- Los mensajes de error son accionables y no muestran cuerpos internos.
- El checkout usa una URL HTTPS; React Native documenta `Linking.openURL` para URLs web en mobile y web.

## Validaciones automatizadas

- El service agrega JWT y envia un body minimo.
- El service conserva la clave idempotente entregada por la accion.
- Los errores mantienen prototipo y mensaje seguro.
- La suite mobile valida bloqueo de doble toque, ausencia de falsa confirmacion, recuperacion de reservas pendientes, recalculo posterior a la sincronizacion y finalizacion del saldo parcial.

## Prueba manual sandbox

La compra sandbox real abrio Checkout Pro y acredito la operacion en la cuenta de prueba. Se detecto que un webhook perdido dejaba el intento local pendiente; el flujo ahora recupera el pago por referencia externa antes de calcular el saldo. Resta repetir visualmente una compra sandbox para confirmar el cierre de la pagina de retorno, el cartel de exito y la opcion de completar el saldo cuando corresponda.
