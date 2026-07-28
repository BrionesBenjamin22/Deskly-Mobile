# Etapa 4: adaptador Mercado Pago Checkout Pro

## Objetivo

Implementar el adaptador real de `PaymentGatewayPort` sin filtrar conceptos de Mercado Pago al dominio ni exponer credenciales al frontend.

## Riesgos heredados obligatorios

| Riesgo de Etapa 3 | Correccion obligatoria en Etapa 4 | Evidencia |
|---|---|---|
| Solo existe gateway fake | Implementar adaptador Checkout Pro | Tests contractuales con HTTP mock |
| Timeouts/reintentos dependen del fake | Configurar timeout, idempotencia externa y clasificacion retryable | Tests de red y respuestas tardias |
| No existen variables del proveedor | Agregar y validar configuracion por ambiente | Tests de arranque |
| Mapeo de estados externos no existe | Mapear estados a dominio sin perder estados desconocidos | Matriz de tests |
| URLs de retorno pueden ser inseguras | Validarlas desde configuracion backend | Tests de allowlist/HTTPS productivo |

## Tareas

### M4-01: decidir dependencia

- Verificar version, mantenimiento y vulnerabilidades del SDK oficial.
- Comparar SDK contra adaptador HTTP nativo.
- Presentar la decision antes de instalar cualquier paquete.
- Preferencia inicial: HTTP nativo para reducir superficie y mantener control del contrato.

### M4-02: configurar secretos

- Variables para access token, webhook secret, URLs de retorno, timeout y ambiente.
- Validar presencia solo cuando el proveedor activo sea Mercado Pago.
- Rechazar secretos cortos/vacios y HTTP en produccion.
- Actualizar `.env.example`, nunca `.env` real ni valores productivos.

### M4-03: crear preferencia/checkout

- Enviar centavos convertidos de manera exacta al formato requerido.
- Usar referencia externa interna y metadata minima.
- Propagar idempotency key al proveedor cuando el endpoint lo soporte.
- Configurar expiracion y URLs desde backend.
- Devolver solo ID externo, checkout URL, estado normalizado y expiracion.

### M4-04: consultar estado real

- Consultar por ID externo.
- Validar referencia, importe y moneda.
- No devolver respuesta completa del proveedor a aplicacion o controller.
- Clasificar 4xx, 5xx, timeout y respuesta invalida con errores seguros.

### M4-05: mapear estados

- Cubrir pendientes, en proceso, aprobados, rechazados, cancelados, vencidos y reembolsados.
- Un estado externo desconocido no debe aprobar el pago.
- Mantener razon externa sanitizada y acotada.

### M4-06: preparar verificacion de webhook

- Implementar firma en el adaptador conforme a documentacion oficial.
- Extraer solo event ID, payment ID y tipo.
- El procesamiento transaccional queda para Etapa 5.

### M4-07: pruebas

- Creacion y consulta exitosas con mocks HTTP.
- Idempotencia externa.
- Timeout, desconexion, 429, 4xx, 5xx y JSON invalido.
- Estado desconocido.
- Monto, moneda o referencia incoherentes.
- Credenciales ausentes y HTTPS obligatorio en produccion.
- Ausencia de secretos en errores y logs capturados.

## Criterios de cierre

- El dominio no importa tipos ni SDK de Mercado Pago.
- Credenciales permanecen solo en backend.
- El retorno visual no aprueba pagos.
- Todos los riesgos heredados estan cerrados.
- El fake sigue siendo seleccionable para tests automáticos.

## Commit sugerido

`feat(pagos): integrar Mercado Pago de forma segura`

## Estado de cierre

Etapa completada y validada automaticamente.

- Adaptador HTTP nativo sin dependencia adicional.
- Configuracion condicional, secretos solo en backend y HTTPS productivo.
- Checkout idempotente con importe exacto, expiracion y metadata minima.
- Consulta conservadora con validacion de referencia, importe y moneda.
- Firma HMAC preparada; procesamiento y anti-replay corresponden a Etapa 5.
- Gateway fake conservado para pruebas.
- Evidencia: suite completa, build, E2E de Payments y diff verificados al cierre.
