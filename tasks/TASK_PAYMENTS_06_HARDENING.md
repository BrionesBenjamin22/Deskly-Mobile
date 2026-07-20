# Etapa 6: endurecimiento y cobertura critica

| Campo | Valor |
|---|---|
| ID | `PAYMENTS-06` |
| Modulo | Payments backend |
| Estado | `PENDIENTE` |
| Dependencia | `PAYMENTS-05` |
| Implementacion | `backend/src/modules/payments` |

## Objetivo

Auditar el flujo completo bajo fallos, ataques, concurrencia y regresiones antes de habilitar el frontend definitivo.

## Riesgos heredados obligatorios

| Riesgo de Etapa 5 | Correccion obligatoria en Etapa 6 | Evidencia |
|---|---|---|
| Procesamiento depende de disponibilidad inmediata del proveedor | Definir reintento controlado y conciliacion de pendientes | Tests y caso de uso de conciliacion |
| Fallos posteriores al webhook pueden requerir recuperacion | Verificar rollback, reentrega y operacion manual segura | Tests de fallos parciales |
| Logs pueden filtrar rutas o referencias | Auditar logging y redaccion | Tests de captura de logs |
| Holds vencidos requieren ejecucion operativa | Implementar barrido/conciliacion invocable y desplegable | Test con reloj y documentacion |
| Cobertura e2e previa validaba CRUD inseguro | Reemplazarla por flujo autenticado completo | E2E fake aprobado |

## Tareas

### H6-01: pruebas de seguridad

- Acceso sin JWT y con rol/propietario incorrecto.
- Manipulacion de reserva, opcion, moneda, estado y monto.
- Campos no permitidos y payloads sobredimensionados.
- Idempotency keys vacias, largas, predecibles o reutilizadas.
- Firma ausente, invalida, replay y timing-safe comparison.
- Errores internos y secretos ausentes de respuestas/logs.

### H6-02: pruebas de concurrencia

- Doble clic y diez solicitudes simultaneas.
- Timeout seguido de reintento.
- Dos instancias de aplicacion con misma clave.
- Dos webhooks iguales concurrentes.
- Aprobacion y expiracion simultaneas.
- Dos intentos aprobados para una reserva.
- Confirmacion de reserva ejecutada una sola vez.

### H6-03: fallos parciales y recuperacion

- Proveedor crea checkout y la respuesta se pierde.
- Base falla antes/despues de llamada externa.
- Evento persiste pero la reserva falla.
- Proveedor responde tarde o con estado desconocido.
- Reintentos con backoff acotado y sin ciclos infinitos.
- Conciliacion consulta pagos `PENDING`/`PROCESSING` envejecidos.

### H6-04: observabilidad

- Correlation ID por solicitud cuando la infraestructura existente lo permita sin refactor global.
- Metricas/logs de pendientes antiguos, reintentos, duplicados e inconsistencias.
- Sanitizar query strings y paths de webhook.
- No registrar payloads completos ni firmas.

### H6-05: autorizacion y operacion administrativa

- Consulta global solo para roles aprobados.
- Reembolso permanece fuera de endpoints en esta version.
- Si se habilita en el futuro: solo `ADMIN`, idempotente, auditado y con confirmacion fuerte.

### H6-06: E2E completo con fake

1. Autenticar miembro.
2. Crear reserva pendiente.
3. Iniciar checkout con seña o total.
4. Simular retorno sin confirmar.
5. Enviar webhook firmado.
6. Consultar proveedor fake aprobado.
7. Confirmar reserva.
8. Repetir webhook.
9. Verificar un pago, un evento efectivo y una confirmacion.

### H6-07: regresion completa

- Auth y permisos.
- Disponibilidad y reservas.
- Cancelacion, check-in y penalizaciones.
- Payments unitarios, integracion y E2E.
- Build backend y TypeScript mobile.
- Docker Compose y migraciones desde base limpia.

## Criterios de cierre

- No quedan riesgos criticos o altos sin mitigacion comprobada.
- La suite reproduce concurrencia real con PostgreSQL.
- El flujo se recupera de timeouts y reentregas sin duplicar cobros.
- Logs y respuestas no contienen secretos.
- Todos los riesgos heredados estan cerrados.

## Commit sugerido

`test(payments): strengthen payment security and concurrency coverage`
