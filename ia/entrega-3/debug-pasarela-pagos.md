# Debug de pasarela de pagos

## Solicitud y objetivo

Corregir inconsistencias detectadas durante la integración de Checkout Pro sin
debilitar idempotencia, verificación backend ni separación de estados.

## Incidencias tratadas

### Reserva confirmada antes del pago

La reserva no debía considerarse confirmada al crear la preferencia ni al
volver del navegador. Se separaron el hold, el estado de pago y la confirmación
final. La aprobación solo ocurre después de una verificación autoritativa.

### Pago pendiente sin webhook

Se agregó sincronización y conciliación para consultar el estado externo de
intentos pendientes. La política contempla desconexión, timeout, `408`, `429`
y `5xx` sin duplicar cobros.

### Retorno de Mercado Pago

El retorno visual se trata como continuidad de UX, no como prueba de pago. Se
validan URLs HTTPS antes de abrirlas y el mobile vuelve a consultar el backend.

### Confirmación del checkout bloqueaba la navegación

Se ajustó el flujo para permitir continuar sin presentar el retorno como éxito
financiero. El estado definitivo sigue dependiendo del backend.

### Amplificación de consultas

La pantalla realizaba `3 + 2R` requests, más páginas adicionales. Se agregó
`GET /payments/summary?page=1&limit=9`, reduciendo 103 requests a 1 para 50
reservas sin trasladar autoridad monetaria al cliente.

## Resultados y observaciones

- no se usa Mercado Pago real en tests automatizados;
- el gateway fake se conserva;
- los reintentos y reentregas son idempotentes;
- estados desconocidos nunca se convierten en aprobados;
- no se propagan cuerpos completos ni secretos del proveedor.

## Validación

- focal P2 backend: 4 suites, 16 pruebas;
- Payments backend: 22 suites, 156 pruebas;
- backend completo: 51 suites, 299 pruebas;
- mobile focal: 3 suites, 9 pruebas;
- mobile completo: 19 suites, 71 pruebas;
- build backend, type-check mobile y `git diff --check`: aprobados.

## Mensaje de commit propuesto

`fix(pagos): estabilizar confirmacion y conciliacion`
