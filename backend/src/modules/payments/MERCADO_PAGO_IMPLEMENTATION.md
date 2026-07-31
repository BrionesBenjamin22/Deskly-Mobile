# Implementacion de Mercado Pago en Payments

## Objetivo

Documentar las clases y modulos incorporados o modificados durante la integracion de Mercado Pago Checkout Pro, los casos de uso afectados y las validaciones automatizadas realizadas.

Esta implementacion corresponde a la Etapa 4. La recepcion y el procesamiento transaccional de webhooks pertenecen a la Etapa 5. La prueba manual completa se realizara cuando el frontend pueda abrir el checkout y consultar el resultado.

## Decision tecnica

La integracion utiliza el cliente HTTP nativo de Node.js en lugar del SDK de Mercado Pago.

Propositos de esta decision:

- evitar una dependencia externa adicional;
- controlar explicitamente timeout, cabeceras y clasificacion de errores;
- mantener los tipos de Mercado Pago fuera del dominio;
- facilitar pruebas contractuales con HTTP simulado;
- impedir que respuestas completas del proveedor lleguen a controllers o casos de uso.

## Clases y modulos nuevos

### `MercadoPagoGateway`

Archivo: `infrastructure/gateways/mercado-pago.gateway.ts`

Implementa `PaymentGatewayPort` y concentra la comunicacion HTTP con Mercado Pago.

Responsabilidades:

- crear preferencias de Checkout Pro;
- enviar `X-Idempotency-Key` al proveedor;
- convertir centavos a unidades monetarias sin aceptar importes del frontend;
- enviar referencia externa, metadata minima, expiracion y URLs configuradas en backend;
- seleccionar la URL de checkout de prueba o produccion segun el ambiente;
- validar que la URL recibida pertenezca a Mercado Pago y use HTTPS;
- consultar pagos por identificador externo;
- normalizar estados externos al dominio;
- comparar referencia, importe y moneda con los valores autoritativos internos;
- solicitar reembolsos idempotentes y consultar posteriormente su estado definitivo;
- clasificar errores HTTP, desconexiones, timeouts y respuestas invalidas;
- verificar firmas HMAC de notificaciones;
- devolver solamente los datos minimos definidos por el puerto de dominio.

El adaptador no registra secretos ni propaga mensajes enviados por Mercado Pago.

### `MercadoPagoConfig`

Archivo: `infrastructure/gateways/mercado-pago.config.ts`

Representa y valida la configuracion necesaria para activar Mercado Pago.

Variables utilizadas:

| Variable | Proposito |
|---|---|
| `PAYMENT_GATEWAY` | Selecciona `FAKE` o `MERCADO_PAGO`. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Credencial privada para la API del proveedor. |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secreto privado para validar firmas HMAC. |
| `MERCADO_PAGO_SUCCESS_URL` | Retorno visual para un resultado exitoso. |
| `MERCADO_PAGO_FAILURE_URL` | Retorno visual para un resultado fallido. |
| `MERCADO_PAGO_PENDING_URL` | Retorno visual para un resultado pendiente. |
| `MERCADO_PAGO_NOTIFICATION_URL` | Receptor HTTPS incluido en cada preferencia. |
| `MERCADO_PAGO_ALLOWED_NOTIFICATION_ORIGINS` | Allowlist exclusiva del receptor de webhooks. |
| `MERCADO_PAGO_ALLOWED_RETURN_ORIGINS` | Allowlist de origenes permitidos para los retornos. |
| `MERCADO_PAGO_TIMEOUT_MS` | Tiempo maximo de espera de una llamada externa. |

Reglas de configuracion:

- `FAKE` es el proveedor predeterminado;
- los secretos solo son obligatorios cuando se activa Mercado Pago;
- el access token debe tener al menos 20 caracteres;
- el secreto de webhook debe tener al menos 16 caracteres;
- el timeout debe ser un entero entre 500 y 30000 milisegundos;
- las URLs solo pueden usar HTTP o HTTPS y no pueden contener credenciales;
- en produccion todos los retornos y origenes permitidos deben usar HTTPS;
- toda URL de retorno debe pertenecer a la allowlist configurada.

### Pruebas de `MercadoPagoGateway`

Archivo: `infrastructure/gateways/mercado-pago.gateway.spec.ts`

Pruebas contractuales del adaptador realizadas con HTTP simulado. No utilizan red ni credenciales reales.

### Pruebas de `MercadoPagoConfig`

Archivo: `infrastructure/gateways/mercado-pago.config.spec.ts`

Verifican configuracion valida, valores inseguros, HTTPS productivo y allowlist de retornos.

### Pruebas de arranque

Archivo: `config/env.validation.spec.ts`

Verifican que la aplicacion pueda iniciar con el gateway fake, rechace proveedores desconocidos y no permita activar Mercado Pago sin las variables obligatorias.

## Clases y modulos modificados

### `PaymentGatewayPort`

Archivo: `domain/ports/payment-gateway.port.ts`

Cambios:

- incorpora la propiedad `provider` para eliminar el acoplamiento con `FAKE`;
- elimina las URLs de retorno del comando de dominio;
- agrega `GatewayPaymentExpectation` para validar referencia, importe y moneda;
- conserva operaciones de creacion, consulta, verificacion de webhook y reembolso sin importar tipos del proveedor.

### `FakePaymentGateway`

Archivo: `infrastructure/gateways/fake-payment.gateway.ts`

Continua disponible para desarrollo y pruebas automatizadas. Ahora declara explicitamente el proveedor `FAKE` y cumple el mismo puerto que el adaptador real.

### `PaymentsModule`

Archivo: `payments.module.ts`

Selecciona el gateway durante la construccion del modulo:

- crea `FakePaymentGateway` cuando `PAYMENT_GATEWAY` es `FAKE` o no esta definido;
- crea `MercadoPagoGateway` cuando el proveedor activo es `MERCADO_PAGO`;
- valida la configuracion antes de construir el adaptador real.

### Validacion global de ambiente

Archivo: `config/env.validation.ts`

Valida el nombre del proveedor y exige las variables de Mercado Pago solamente cuando la integracion esta activa. Una configuracion incompleta impide iniciar la aplicacion.

### `.env.example`

Documenta todas las variables requeridas sin incluir credenciales reales.

## Caso de uso afectado

### `CreatePaymentUseCase`

Archivo: `application/use-cases/create-payment.use-case.ts`

Proposito:

Crear o recuperar un checkout idempotente para una reserva autenticada, calculando el importe exclusivamente en backend y manteniendo separados el estado del pago y el estado de la reserva.

Flujo:

1. Obtiene la reserva solicitada.
2. Verifica que pertenezca al miembro autenticado.
3. Verifica que su estado permita iniciar un pago.
4. Rechaza reservas con un pago ya aprobado.
5. Rechaza otro checkout vigente e incompatible.
6. Calcula el importe mediante la politica de precios del dominio.
7. Busca un intento previo usando proveedor y clave de idempotencia.
8. Crea atomicamente el intento y el hold de la reserva cuando no existe.
9. Invoca el gateway seleccionado por ambiente.
10. Persiste el identificador externo y la URL de checkout.
11. Devuelve un DTO seguro sin credenciales ni respuesta completa del proveedor.

Cambios de la Etapa 4:

- la concurrencia en memoria se identifica por proveedor y clave;
- la busqueda idempotente utiliza el proveedor real;
- el intento persiste `FAKE` o `MERCADO_PAGO` segun el gateway activo;
- las URLs dejaron de estar codificadas en el caso de uso;
- la creacion del checkout no confirma ni aprueba la reserva.

## Validaciones realizadas sobre los casos de uso

### Autenticacion y propiedad

- reserva inexistente;
- reserva ajena al miembro autenticado;
- endpoints de checkout y consulta protegidos por JWT;
- consulta limitada al propietario o a roles administrativos autorizados.

### Estado de reserva y pago

- reserva cancelada o no pagable;
- existencia de un pago aprobado;
- existencia de un checkout vigente incompatible;
- la creacion del checkout mantiene el pago pendiente;
- el retorno visual no se considera evidencia de aprobacion.

### Importe y moneda

- importe calculado por la politica de precios backend;
- seña y pago completo;
- centavos enteros positivos;
- conversion exacta de centavos al formato externo;
- moneda limitada a ARS;
- rechazo de importe, moneda o referencia distintos a los valores internos.

### Idempotencia y concurrencia

- repeticion secuencial con la misma clave y operacion;
- solicitudes concurrentes con la misma clave;
- conflicto al reutilizar la clave para otra operacion;
- propagacion de `X-Idempotency-Key` a Mercado Pago;
- reembolso con clave de idempotencia;
- recuperacion luego de timeout antes de crear el checkout;
- recuperacion luego de timeout posterior a la creacion externa.

### Fallos del proveedor

- desconexion de red;
- timeout;
- HTTP 400 y 404 como fallos no reintentables;
- HTTP 408, 429, 500 y 503 como fallos reintentables;
- JSON invalido;
- campos obligatorios ausentes o invalidos;
- checkout hospedado fuera de dominios confiables;
- estado externo desconocido normalizado como `PROCESSING` y nunca como `APPROVED`;
- ausencia de secretos en errores y resultados.

### Seguridad de configuracion

- proveedor desconocido;
- credenciales ausentes, vacias o demasiado cortas;
- timeout fuera del rango permitido;
- protocolo de URL invalido;
- credenciales embebidas en URLs;
- URL HTTP en produccion;
- retorno fuera de la allowlist;
- fake seleccionable sin secretos externos.

### Firma de webhook preparada

- extraccion de `ts` y `v1` desde `x-signature`;
- construccion del manifiesto oficial con identificador, request ID y timestamp;
- calculo HMAC-SHA256;
- comparacion en tiempo constante;
- rechazo de firma ausente, malformada o incorrecta;
- extraccion exclusiva de event ID, payment ID y tipo.

El control de replay, la persistencia del evento y la actualizacion transaccional del pago se implementaran en la Etapa 5.

## Evidencia automatizada de cierre

Ultima validacion ejecutada:

| Validacion | Resultado |
|---|---|
| Build de NestJS | Correcto |
| Suites unitarias | 34 aprobadas |
| Pruebas unitarias | 206 aprobadas |
| E2E de Payments con PostgreSQL | 5 aprobadas |
| `git diff --check` | Correcto |

Las pruebas manuales no forman parte de este cierre porque se realizaran cuando el frontend implemente la apertura del checkout y la consulta del estado.
