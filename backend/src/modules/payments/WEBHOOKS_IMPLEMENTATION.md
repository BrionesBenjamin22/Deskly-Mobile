# Webhooks de pagos

## Proposito y componentes

La etapa `PAYMENTS-05` recibe notificaciones seguras e idempotentes. El body solo aporta identificadores: estado, importe, moneda y referencia se consultan nuevamente al proveedor y se comparan con el snapshot local.

| Componente | Proposito |
|---|---|
| `PaymentWebhooksController` | Ruta publica aislada, body crudo, limite de tamano y errores seguros. |
| `ProcessPaymentWebhookUseCase` | Firma, deduplicacion, consulta autoritativa y transicion. |
| `PrismaPaymentAttemptRepository.saveStatus` | Pago, evento y reserva en una transaccion con version optimista. |
| `DuplicatePaymentEventError` | Carrera contra el constraint unico del evento. |
| `DuplicateReservationApprovalError` | Evita conservar dos aprobaciones para una reserva. |
| `main.ts` con `rawBody: true` | Conserva los bytes recibidos para validar la notificacion. |

## Contrato HTTP utilizado

- Metodo: `POST`.
- Ruta: `/webhooks/payments`.
- Tipo: `application/json`.
- Sin JWT; exige firma valida del proveedor.
- Maximo: `16384` bytes (16 KiB).

### Headers Mercado Pago

```http
x-signature: ts=<timestamp>,v1=<hmac-sha256-hex>
x-request-id: <identificador-de-solicitud>
```

`ts` debe tener entre 10 y 16 digitos y `v1` exactamente 64 caracteres hexadecimales. El HMAC se compara con `timingSafeEqual`.

### Body Mercado Pago

```json
{
  "id": 987654321,
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

| Campo | Uso |
|---|---|
| `id` | ID del evento, unico por proveedor. |
| `type` | Tipo externo recibido. |
| `data.id` | ID del pago usado para consultar `GET /v1/payments/:id`. |

No se confia en ningun importe, moneda, referencia ni estado del body. Otros campos se ignoran.

### Canonicalizacion y firma

```text
manifest = id:<data.id en minusculas>;request-id:<x-request-id>;ts:<ts>;
v1 = HMAC-SHA256(MERCADO_PAGO_WEBHOOK_SECRET, manifest)
```

El secreto y el access token permanecen en backend y nunca aparecen en logs, respuestas o eventos.

### Gateway fake de pruebas

```json
{
  "eventId": "event-1",
  "externalPaymentId": "fake-payment-1",
  "eventType": "payment"
}
```

Usa `x-fake-signature`, HMAC-SHA256 hexadecimal del body crudo completo. Solo se utiliza con `PAYMENT_GATEWAY=FAKE`.

### Respuestas seguras

| HTTP | Condicion |
|---|---|
| `200` | Procesado, replay idempotente o evento firmado sin pago local. |
| `403` | Firma ausente, mal formada o invalida. |
| `413` | Body superior a 16 KiB. |
| `422` | Notificacion o respuesta no reintentable. |
| `503` | Timeout, desconexion, 408, 429 o 5xx; admite reintento. |

## Flujo y controles

1. Verificar firma antes de consultar o persistir.
2. Ignorar de forma segura los eventos cuyo `type` no sea `payment`.
3. Deduplicar por `provider + externalEventId`, incluido el replay concurrente.
4. Consultar al proveedor por el ID externo.
5. Comparar referencia, ARS e importe en unidades menores.
6. No degradar estados `APPROVED` o `REFUNDED` por eventos tardios.
7. Persistir estado, `PaymentEvent` y reserva en una transaccion.
8. Confirmar el hold una sola vez. Una segunda aprobacion se reembolsa con `duplicate-approval:<paymentId>` y se registra `REFUNDED`.
9. Ante `EXPIRED` o `CANCELLED`, liberar el hold y devolver la reserva a `RESERVED` conforme al contrato actual.

## Validaciones realizadas

| Validacion | Evidencia |
|---|---|
| Build Nest y Prisma Client | Aprobado. |
| Tests especificos | 3 suites, 20 pruebas aprobadas. |
| Suite unitaria backend | 36 suites, 219 pruebas aprobadas. |
| Suite E2E backend | 2 suites, 6 pruebas aprobadas. |
| Firma valida/invalida, limite y errores HTTP | Cubiertos. |
| Replay previo y carrera unica | Cubiertos. |
| Evento tardio y proveedor no disponible | Cubiertos. |
| Incompatibilidad de importe, moneda y referencia | Cubierta. |
| Pago, evento y reserva atomicos | Cubiertos. |
| Segunda aprobacion y reembolso idempotente | Cubiertos. |

Las pruebas manuales quedan diferidas hasta disponer del frontend. No sustituyen estas validaciones automatizadas.
