# Feature Payments

## Proposito

La feature muestra solamente reservas que ya poseen un pago aprobado. Conserva la tarjeta superior de saldo pendiente y permite completar pagos parciales con importes calculados por backend. Inicia un checkout hospedado y solo presenta una confirmacion cuando Deskly devuelve `APPROVED`.

## Componentes y flujo

- `PaymentsScreen`: conserva el estilo de tarjetas, muestra el total pendiente arriba y el desglose total, abonado y saldo de cada reserva. Pagina 9 reservas por vez.
- `usePayments`: consume una pagina autoritativa de 9 resÃºmenes de pago y
  adapta la fecha ISO al texto visible. La sincronizaciÃ³n, el filtrado de pagos
  aprobados y el cÃ¡lculo de saldos quedan concentrados en backend.
- `payments.service.ts`: concentra el resumen paginado, cotizaciÃ³n, checkout,
  consulta de intento y listado por reserva.
- `payment.types.ts`: estados, opciones, cotizacion e intentos normalizados.

Flujo:

1. Desde Escritorios, el usuario elige seña o pago total antes de confirmar.
2. El backend crea un hold tecnico `PENDING_PAYMENT`; la app solicita inmediatamente su cotizacion y checkout.
3. Se valida que `checkoutUrl` use HTTPS y se abre con `Linking.openURL`.
4. Las URLs de retorno abren una pagina backend que permite cerrar el checkout. Volver a la app no confirma el pago: se consulta `GET /payments/:id` hasta recibir un estado terminal o alcanzar el vencimiento informado por backend.
5. Solo `APPROVED` confirma la reserva y se presenta como exito.
6. Si el webhook no llego, las consultas autenticadas permiten que backend recupere el pago por referencia externa, lo valide y actualice la reserva.
   La conciliacion periodica del backend ofrece el mismo respaldo aunque el
   usuario cierre la aplicacion.
7. La pestaña Pagos queda reservada visualmente para reservas con un pago aprobado. Incluye temporalmente reservas pendientes durante la sincronizacion; si fue una seña, ofrece completar exclusivamente el saldo pendiente.
8. La accion `Completar pago` presenta la cotizacion y sus opciones en un modal
   centrado. Cerrar el modal no modifica el intento ni llama al backend; iniciar
   una opcion conserva el mismo checkout, idempotencia y polling existentes.
9. La pantalla permite filtrar `Todos`, `Pendientes` y `Completados`. El filtro
   se envia al resumen backend y se aplica antes de paginar para conservar el
   limite de 9 resultados y conteos coherentes.
8. Durante la espera el loader permanece animado. Tanto al reservar desde
   Escritorios como al completar saldo desde Pagos, `Dejar de esperar` cierra
   solamente el modal bloqueante: la verificacion continua en segundo plano y
   muestra una confirmacion breve si el pago resulta aprobado.

## Contratos

Resumen paginado:

```http
GET /payments/summary?page=1&limit=9
Authorization: Bearer <token>
```

La respuesta contiene `items` y `pagination`. La pantalla realiza una sola
solicitud por pÃ¡gina y conserva el mensaje de error y la acciÃ³n de recarga
cuando el backend no estÃ¡ disponible.

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
- El listado de Pagos consume una sola solicitud paginada por carga.
- El service conserva la clave idempotente entregada por la accion.
- Los errores mantienen prototipo y mensaje seguro.
- La suite mobile valida bloqueo de doble toque, ausencia de falsa confirmacion, recuperacion de reservas pendientes, recalculo posterior a la sincronizacion y finalizacion del saldo parcial.

## Prueba manual sandbox

La compra sandbox real abrio Checkout Pro y acredito la operacion en la cuenta
de prueba. La recepcion se debe disparar con el simulador oficial cuando se usan
credenciales de prueba. El flujo recupera pagos por referencia tanto durante el
polling como mediante conciliacion. Resta ejecutar la simulacion manual acordada
y confirmar visualmente el cierre, el cartel de exito y el saldo restante.
