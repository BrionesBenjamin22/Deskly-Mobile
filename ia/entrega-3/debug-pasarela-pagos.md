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

## Seguimiento: confirmacion sandbox resiliente

Se verifico que las preferencias no incluian `notification_url` y que la
conciliacion expiraba intentos sin `payment_id` antes de buscarlos por
`external_reference`.

Se implemento:

- `notification_url` HTTPS obligatoria, con origen permitido, ruta exacta y
  `source_news=webhooks`;
- envio de esa URL al crear cada preferencia;
- recuperacion autoritativa por `external_reference` antes de expirar;
- worker de conciliacion configurable, acotado y sin solapamiento local;
- configuracion segura para ejecutar un solo worker lider o un scheduler externo;
- documentacion del flujo manual mediante el simulador oficial.

El polling mobile ya cumplia el contrato: permanece en espera ante estados no
terminales, permite dejar de esperar y solo confirma cuando backend devuelve
`APPROVED`. No se modifico su comportamiento.

Validacion automatizada:

- Payments backend: 23 suites y 165 pruebas;
- backend completo: 53 suites y 321 pruebas;
- E2E PostgreSQL: 3 suites y 17 pruebas;
- mobile completo: 22 suites y 85 pruebas;
- builds, Expo web, Docker, lint, formato y `git diff --check`: aprobados;
- backend, base de datos y mobile: saludables.

La simulacion con un pago sandbox real y su comprobacion visual permanecen
pendientes por decision del usuario. La tarea canonica `PAYMENTS-08` continua
en estado `EN_PROGRESO`.

### Ajuste del contrato real del simulador

Durante la prueba manual, el pago `170515659197` fue recuperado por
conciliacion y Deskly lo aplico como aprobado, aun sin webhook. El simulador
mostro body `{}` y timeout; el inspector de ngrok no registro esa solicitud.

La documentacion oficial confirmo que la firma se calcula con `data.id` de la
query. Se ajusto el receptor para transportar y validar esa query, aceptar body
vacio solo con firma y request ID validos, y rechazar cualquier diferencia entre
query y body. La entrega efectiva desde el panel sigue pendiente.

La repeticion final fue exitosa: ngrok recibio el POST firmado del simulador
con `data.id=170515659197`, identifico el cliente de Mercado Pago y respondio
HTTP 200. Deskly registro un unico evento y mantuvo el pago aprobado, demostrando
convergencia idempotente entre conciliacion y webhook. `PAYMENTS-08` queda
completada; las comprobaciones visuales restantes pertenecen a `PAYMENTS-07`.
