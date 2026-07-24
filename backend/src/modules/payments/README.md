# Modulo Payments

El contrato, los casos de uso y las validaciones de webhooks se detallan en [WEBHOOKS_IMPLEMENTATION.md](./WEBHOOKS_IMPLEMENTATION.md). El endurecimiento y la conciliacion se documentan en [HARDENING_IMPLEMENTATION.md](./HARDENING_IMPLEMENTATION.md). La puesta en marcha, rotacion y diagnostico se describen en [OPERATIONS.md](./OPERATIONS.md). La corroboracion real se registra con [MANUAL_SANDBOX_CHECKLIST.md](./MANUAL_SANDBOX_CHECKLIST.md).

## Entornos y tunel HTTPS local

Nest y Prisma cargan configuracion con la siguiente precedencia: `.env.<entorno>.local`, `.env.<entorno>`, `.env.local` y `.env`. `NODE_ENV=test` utiliza el sufijo `testing`. El repositorio incluye plantillas para `development`, `testing` y `production`; todos los archivos reales y sus variantes locales permanecen ignorados por Git.

Para probar Webhooks de Mercado Pago desde el backend local:

1. Iniciar el backend en `http://localhost:3000`.
2. Ejecutar `ngrok http 3000`.
3. Consultar la URL HTTPS asignada en `http://127.0.0.1:4040/api/tunnels`.
4. Registrar en Mercado Pago la URL `<HTTPS_NGROK>/webhooks/payments` para el evento Pagos.
5. Guardar Access Token y secreto Webhook solo en `.env.development.local`, cambiar `PAYMENT_GATEWAY` a `MERCADO_PAGO` y reiniciar el backend.
6. Actualizar también las URLs de retorno y `MERCADO_PAGO_ALLOWED_RETURN_ORIGINS` cada vez que cambie el dominio gratuito.

Evidencia del 22 de julio de 2026: ngrok `3.39.10` expuso correctamente el backend local; `GET /docs` respondió HTTP 200 y `POST /webhooks/payments` sin firma respondió HTTP 403. Esto valida transporte HTTPS y rechazo de notificaciones no autenticadas, pero no reemplaza la compra sandbox firmada pendiente en `MANUAL_SANDBOX_CHECKLIST.md`. El dominio gratuito es efimero y no debe copiarse a produccion.

## Proveedores de checkout

`PAYMENT_GATEWAY` selecciona el proveedor solo en backend: `FAKE` es el valor por defecto para desarrollo y pruebas; `MERCADO_PAGO` activa el adaptador Checkout Pro basado en el SDK oficial `mercadopago@3.2.0` y exige token, secreto de webhook, URLs de retorno y timeout validos.

El dominio no importa tipos de Mercado Pago. Los secretos no forman parte de DTOs, respuestas ni errores. Las URLs provienen de configuracion backend y deben usar HTTPS en produccion. La preferencia recibe importe ARS calculado en backend, referencia interna, metadata minima, expiracion y `X-Idempotency-Key`.

La consulta externa normaliza estados y compara referencia, importe y moneda contra el intento interno. Un estado desconocido queda `PROCESSING`, nunca `APPROVED`. El retorno visual tampoco aprueba pagos.

El host debe mantener el reloj sincronizado mediante NTP. La preferencia usa una expiracion absoluta; un desfase horario puede hacer que Mercado Pago la reciba ya vencida. El diagnostico debe comparar el reloj UTC local con el header `Date` del proveedor antes de modificar la duracion del hold.

### SDK oficial y clases integradas

`MercadoPagoGateway` conserva la implementacion del puerto de dominio `PaymentGatewayPort` y encapsula tres clientes oficiales:

- `MercadoPagoConfig`: mantiene el access token y el timeout exclusivamente en backend.
- `Preference`: crea una preferencia de Checkout Pro por intento con importe, moneda, referencia, expiracion, URLs e idempotencia construidos por el backend.
- `Payment`: obtiene el estado definitivo para webhooks, polling y conciliacion; su respuesta se contrasta contra referencia, importe y moneda internos.
- `PaymentRefund`: ejecuta el reembolso total idempotente cuando la politica de concurrencia detecta una aprobacion duplicada.
- `MercadoPagoSdkClients`: fachada inyectable del adaptador. Permite simular el SDK sin red ni credenciales y evita acoplar casos de uso o dominio a sus tipos.

La verificacion del webhook no se delega al transporte: valida el cuerpo crudo, `x-signature` y `x-request-id` mediante HMAC SHA-256 y comparacion en tiempo constante antes de consultar el pago por SDK. Los errores del SDK se traducen a `PaymentGatewayError`; nunca se propagan bodies, tokens ni mensajes del proveedor. Los estados HTTP 408, 429 y 5xx se clasifican como reintentables; los 4xx restantes son definitivos.

La preferencia y el pago son recursos externos diferentes. Crear Checkout Pro guarda solamente la URL de la preferencia; no utiliza su ID como si fuera un pago. Cuando llega una notificacion, el backend consulta el ID real del pago, correlaciona mediante la referencia unica `payment:<id interno>`, valida importe y moneda, y recien entonces persiste el identificador real y aplica la transicion.

| Caso de uso                | Cliente SDK                   | Validaciones automatizadas                                                                                                                             |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Crear checkout             | `Preference`                  | Payload autoritativo ARS, URLs backend, expiracion, idempotencia y allowlist HTTPS de los dominios oficiales `mercadopago.com` y `mercadopago.com.ar`. |
| Consultar o conciliar pago | `Payment`                     | Mapeo conservador de estados y coincidencia de referencia, importe y moneda.                                                                           |
| Procesar webhook           | `Payment` luego de HMAC local | Firma valida, datos minimos, anti-replay transaccional y confirmacion solo con estado verificado.                                                      |
| Reembolsar duplicado       | `PaymentRefund` y `Payment`   | Idempotencia del reembolso y lectura posterior del estado definitivo.                                                                                  |
| Fallo externo              | Todos                         | Timeout, desconexion, 408, 429 y 5xx reintentables; errores sanitizados sin secretos.                                                                  |

Variables: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_SUCCESS_URL`, `MERCADO_PAGO_FAILURE_URL`, `MERCADO_PAGO_PENDING_URL`, `MERCADO_PAGO_ALLOWED_RETURN_ORIGINS` y `MERCADO_PAGO_TIMEOUT_MS`. La allowlist contiene origenes separados por coma. Nunca versionar valores reales.

## Funcionalidad

Gestiona intentos de pago autenticados para reservas. El backend calcula importes, conserva el snapshot de precios y coordina la idempotencia antes de invocar al proveedor.

## Contratos HTTP

Todos los endpoints requieren JWT.

```http
POST /payments/checkout
GET /payments/:id
GET /reservations/:id/payments
GET /reservations/:id/payment-quote
POST /payments/operations/reconcile
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
- Crear una reserva genera solamente un hold tecnico `PENDING_PAYMENT` por 15 minutos; todavia no es una reserva confirmada.
- El checkout inicial conserva ese hold. Solo un pago `APPROVED`, verificado por webhook o conciliacion, cambia la reserva a `RESERVED`.
- Si la seña queda aprobada, la reserva se confirma y un checkout posterior `FULL` cobra exclusivamente el saldo restante.
- La cotizacion informa `totalMinorUnits`, `approvedMinorUnits` y `pendingMinorUnits`. Despues de una seña solo ofrece la opcion `FULL` por el remanente.
- Una clave repetida con los mismos datos reutiliza el intento; con datos diferentes devuelve conflicto.
- Un pago total aprobado o un checkout vigente incompatible impiden otro intento.
- Un reintento compatible recupera el checkout vigente; si el proveedor fallo antes de devolver la URL, reutiliza la clave externa original para completar la creacion sin duplicar pagos.
- Un fallo definitivo o la expiracion del pago inicial cancela el hold no confirmado. Un timeout reintentable conserva la operacion.
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
