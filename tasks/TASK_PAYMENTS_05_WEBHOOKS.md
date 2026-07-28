# Etapa 5: webhooks seguros e idempotentes

| Campo | Valor |
|---|---|
| ID | `PAYMENTS-05` |
| Modulo | Payments backend |
| Estado | `COMPLETADA` |
| Dependencia | `PAYMENTS-04` completada |
| Implementacion | `backend/src/modules/payments` |

## Objetivo

Procesar notificaciones asincronas verificando firma y estado directamente con el proveedor, actualizando pago, evento y reserva de forma consistente.

## Riesgos heredados obligatorios

| Riesgo de Etapa 4 | Correccion obligatoria en Etapa 5 | Evidencia |
|---|---|---|
| Firma solo se interpreta en el adaptador | Crear endpoint separado y exigir firma valida | Tests HTTP de firma |
| Estado real se consulta, pero no actualiza dominio | Implementar caso de uso transaccional | Tests pago-evento-reserva |
| Duplicados y replay no tienen efecto definido | Persistir event ID unico y responder idempotentemente | Tests repetidos/concurrentes |
| Eventos fuera de orden pueden degradar estado | Aplicar matriz de transiciones y consulta autoritativa | Tests de orden inverso |
| Reserva sigue pendiente tras aprobacion | Cambiar a `RESERVED` solo con `APPROVED` validado | Test transaccional |
| Holds vencidos no se liberan | Expirar pago y reserva de forma consistente | Tests con reloj controlado |

## Tareas

### W5-01: endpoint dedicado

- Ruta separada del flujo de usuario, sin JWT.
- Acceso condicionado por firma del proveedor.
- Preservar raw body cuando la firma lo requiera.
- Limitar tamaño del body y rechazar estructura invalida.
- Responder rapidamente sin incluir detalles internos.

### W5-02: validar y deduplicar

- Verificar firma antes de parsear o persistir efectos.
- Extraer solo identificadores necesarios.
- Consultar `externalEventExists` y constraint unico.
- Tratar replay como exito idempotente sin repetir cambios.

### W5-03: consultar fuente autoritativa

- Ignorar monto y estado del cuerpo del webhook.
- Consultar el pago directamente a Mercado Pago.
- Validar referencia externa, moneda e importe contra snapshot local.
- Rechazar y auditar inconsistencias sin aprobar reserva.

### W5-04: aplicar transicion transaccional

- Bloquear o actualizar condicionalmente el intento.
- Aplicar transicion de dominio.
- Guardar evento y nuevo estado en la misma transaccion.
- Si pasa a `APPROVED`, cambiar reserva `PENDING_PAYMENT` a `RESERVED` una sola vez.
- Si pasa a `EXPIRED` o `CANCELLED`, liberar/cancelar el hold conforme al contrato aprobado.
- Un rechazo permite un nuevo intento sin confirmar reserva.

### W5-05: manejar orden y concurrencia

- Evento tardio no degrada `APPROVED`.
- `APPROVED` puede llegar antes de `PROCESSING`.
- Dos webhooks iguales producen un solo evento efectivo.
- Dos eventos diferentes concurrentes respetan la transicion terminal.
- Dos intentos aprobados no confirman dos veces ni cobran saldo superior.

### W5-06: observabilidad segura

- Loggear correlacion, payment ID interno, event ID truncado/seguro, resultado y duracion.
- No loggear firma, access token, body completo ni datos personales.
- Contabilizar duplicados, inconsistencias y errores retryable.

### W5-07: pruebas

- Firma ausente, invalida y valida.
- Webhook duplicado dos y multiples veces.
- Replay concurrente.
- Eventos distintos y fuera de orden.
- Pago inexistente.
- Proveedor no disponible.
- Monto, moneda y referencia incompatibles.
- Aprobacion conjunta de pago y reserva.
- Rollback si falla la reserva o el evento.
- Expiracion del hold y liberacion de disponibilidad.

## Criterios de cierre

- Ninguna URL de retorno confirma pagos.
- La aprobacion requiere consulta exitosa al proveedor.
- Pago, evento y reserva permanecen transaccionalmente consistentes.
- Duplicados y replay no repiten efectos.
- Todos los riesgos heredados estan cerrados.

## Commit sugerido

`feat(pagos): procesar webhooks seguros e idempotentes`
