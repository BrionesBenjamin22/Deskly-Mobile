# Pasarela de pagos

## Solicitud y objetivo

Diseñar un flujo de pagos seguro con Mercado Pago Checkout Pro, conservando un
gateway fake determinista y evitando confirmar reservas por el retorno visual
del navegador.

## Funcionalidades realizadas

- cotización autoritativa en ARS;
- opciones depósito y pago total;
- hold de reserva;
- creación idempotente de checkout;
- gateway fake y adaptador Mercado Pago;
- intentos y eventos persistidos;
- webhooks firmados, anti-replay y transaccionales;
- conciliación y recuperación de intentos pendientes;
- checkout mobile con validación HTTPS;
- consulta de resumen paginado de pagos.

## Seguridad y decisiones

- secretos únicamente en backend;
- importe, moneda, referencia y estado verificados contra datos internos;
- la preferencia creada permanece pendiente;
- solo un pago aprobado y verificado confirma la reserva;
- estado del pago separado del estado de la reserva;
- idempotencia aislada por proveedor y clave;
- errores del proveedor clasificados y sanitizados;
- endpoints sensibles autenticados y limitados.

## Validación registrada

El cierre de la optimización P2 registra 22 suites y 156 pruebas de Payments,
51 suites y 299 pruebas backend, 19 suites y 71 pruebas mobile, build backend,
type-check mobile y `git diff --check` aprobados.

## Mensaje de commit propuesto

`feat(pagos): integrar checkout seguro y webhooks`
