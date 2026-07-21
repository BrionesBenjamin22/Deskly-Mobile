# Endurecimiento y conciliacion de Payments

## Proposito

La Etapa 6 agrega recuperacion operativa, cobertura concurrente y observabilidad segura al flujo de pagos. No habilita reembolsos manuales ni confirma pagos por retorno del navegador.

## Clases y modulos integrados

| Clase o modulo | Proposito |
|---|---|
| `ReconcileStalePaymentsUseCase` | Concilia por lotes pagos `PENDING` y `PROCESSING` envejecidos contra el proveedor activo. |
| `PaymentOperationsController` | Expone la conciliacion manual protegida para `ADMIN` y `GESTOR`. |
| `ReconcilePaymentsBodyDto` | Limita el lote a 1-100 registros y la antiguedad a 1-1440 minutos. |
| `PaymentAttemptRepositoryPort.listStale` | Selecciona de forma determinista pagos antiguos del proveedor activo. |
| `PrismaPaymentAttemptRepository.listStale` | Implementa la consulta por proveedor, estado y fecha de actualizacion. |
| `request-observability` | Valida/genera correlation IDs y elimina queries e identificadores sensibles de rutas registradas. |

Clases modificadas:

- `PaymentsModule`: registra el caso de uso y controller operativos.
- `HttpExceptionLoggingFilter`: devuelve y registra rutas sanitizadas; los 5xx ya no incluyen stack ni detalles internos en logs.
- `main.ts`: agrega `x-correlation-id` y evita registrar query strings.
- `payments-integration.e2e-spec.ts`: valida concurrencia con PostgreSQL y el flujo fake firmado completo.

## Caso de uso de conciliacion

```text
POST /payments/operations/reconcile
Authorization: Bearer <JWT de ADMIN o GESTOR>
Content-Type: application/json
```

```json
{
  "limit": 50,
  "minAgeMinutes": 5
}
```

Ambos campos son opcionales. La operacion selecciona como maximo 100 intentos del proveedor activo, consulta una vez al proveedor por intento, valida referencia/monto/moneda, expira holds sin checkout, persiste de forma transaccional, absorbe carreras y reembolsa idempotentemente una segunda aprobacion.

```json
{
  "scanned": 12,
  "updated": 4,
  "expired": 2,
  "retryableFailures": 1,
  "inconsistencies": 0
}
```

No hay ciclos de reintento internos. Un scheduler u operador puede invocar nuevamente el endpoint con backoff externo, manteniendo cada lote acotado.

## Seguridad y fallos parciales

- JWT obligatorio y roles `ADMIN`/`GESTOR`; no existe endpoint de reembolso manual.
- Proveedor, importe, moneda y referencia provienen de persistencia, nunca del request.
- Los pagos de otro proveedor no son conciliados.
- Los estados desconocidos nunca se convierten en aprobados.
- Un error reintentable no bloquea el resto del lote.
- Los logs solo incluyen IDs locales truncados y contadores; no cuerpos, firmas, URLs, tokens o mensajes del proveedor.
- Las rutas HTTP se registran sin query y los errores 5xx no imprimen stacks potencialmente sensibles.
- La version optimista evita sobrescribir aprobacion, expiracion o reentrega concurrentes.

## Contrato del webhook validado

El contrato completo esta en `WEBHOOKS_IMPLEMENTATION.md`. Resumen Mercado Pago:

```text
POST /webhooks/payments
x-signature: ts=<timestamp>,v1=<hmac-sha256-hex>
x-request-id: <identificador>
Content-Type: application/json
Tamano maximo: 16384 bytes
```

```json
{
  "id": 987654321,
  "type": "payment",
  "data": { "id": "1234567890" }
}
```

Manifiesto: `id:<data.id en minusculas>;request-id:<x-request-id>;ts:<ts>;`. `v1` es su HMAC-SHA256 con `MERCADO_PAGO_WEBHOOK_SECRET` y se compara en tiempo constante. El body solo aporta IDs y tipo; estado, importe, moneda y referencia se consultan y contrastan con la base.

## Matriz de validaciones

| Caso | Validacion automatizada |
|---|---|
| Lote acotado y envejecido | Unitarios de caso de uso y repositorio. |
| Hold vencido sin checkout | Transicion a `EXPIRED` y liberacion transaccional. |
| Estado externo | Consulta con expectativas autoritativas y persistencia optimista. |
| Timeout o 5xx | Conteo reintentable, continuidad del lote y log redactado. |
| Dos aprobaciones | Reembolso `duplicate-approval:<paymentId>`. |
| Diez checkouts simultaneos | E2E PostgreSQL: un pago. |
| Dos webhooks concurrentes y replay | E2E PostgreSQL: un evento efectivo y una confirmacion. |
| Propietario incorrecto/JWT ausente | E2E y unitarios HTTP. |
| Payload y clave invalidos | ValidationPipe, DTOs y tests HTTP. |
| Firma ausente/invalida/timing-safe | Tests de gateways y controller. |
| Datos sensibles en logs | Tests de observabilidad y captura de logger. |

## Operacion, limites y pruebas manuales

No se agregaron variables, dependencias ni migraciones. El endpoint puede invocarse desde cron autenticado, job o procedimiento administrativo y es compatible con multiples instancias por version optimista y constraints unicos.

- Reembolsos manuales y scheduler externo quedan fuera de alcance.
- La prueba sandbox y el retorno visual se difieren hasta `PAYMENTS-07`.
- La prueba manual futura debe abrir checkout, volver sin asumir exito, entregar webhook y consultar el estado confirmado por backend.
