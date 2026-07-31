# Operacion de Payments

## Ambientes

`PAYMENT_GATEWAY=FAKE` se usa en desarrollo y pruebas deterministas. `MERCADO_PAGO` usa el SDK oficial Node.js `mercadopago@3.2.0` y exige exclusivamente en backend token, secreto de webhook, URLs HTTPS de retorno, allowlist y timeout. No copiar credenciales reales a archivos versionados, mobile, logs o tickets.

## Puesta en marcha

1. Configurar credenciales del ambiente correspondiente en el gestor de secretos.
2. Registrar `POST /webhooks/payments` como URL HTTPS del proveedor y configurar
   la misma direccion en `MERCADO_PAGO_NOTIFICATION_URL`, agregando
   `?source_news=webhooks`.
3. Verificar `MERCADO_PAGO_ALLOWED_RETURN_ORIGINS` y las tres URLs de retorno.
4. Aplicar migraciones antes de iniciar el backend.
5. Ejecutar healthcheck, cotizacion autenticada y checkout de prueba.
6. Entregar un webhook firmado y comprobar pago, evento y reserva.

## Rotacion

Rotar access token y webhook secret de forma coordinada. Durante la ventana, detener nuevos checkouts o usar una estrategia de secretos duales en una etapa futura; la implementacion actual acepta un solo secreto. Reiniciar instancias, enviar una notificacion de prueba y revocar el secreto anterior.

## Proveedor caido y conciliacion

- Timeout, desconexion, 408, 429 y 5xx son reintentables con backoff externo acotado.
- Ejecutar `POST /payments/operations/reconcile` con JWT `ADMIN` o `GESTOR`, lote maximo 100 y antiguedad minima.
- Alternativamente, habilitar `PAYMENT_RECONCILIATION_ENABLED=true` en una sola
  instancia. El worker evita solapamientos dentro del proceso y respeta
  intervalo, lote y antiguedad configurados.
- En despliegues con balanceo, mantener el worker interno deshabilitado y usar
  un scheduler externo para evitar que cada replica inicie su propio ciclo.
- Revisar `retryableFailures` e `inconsistencies`; nunca cambiar estados directamente en base.
- Las reentregas de webhook son seguras por constraint de proveedor/evento.

## Diagnostico

- `PENDING` antiguo: verificar proveedor y ejecutar conciliacion. Si el intento
  aun no posee ID de pago, se busca primero por `external_reference`; solo se
  marca `EXPIRED` cuando no existe coincidencia autoritativa y vencio el hold.
- `inconsistencies > 0`: correlacionar por ID local truncado y revisar carrera de version.
- Segunda aprobacion: el backend solicita reembolso idempotente.
- Retorno visual sin aprobacion: comportamiento esperado; esperar webhook o conciliar.

## Reembolsos y riesgos conocidos

No existe endpoint de reembolso manual. Solo se reembolsa automaticamente una segunda aprobacion que pierde la carrera de reserva. El scheduler de conciliacion es externo y debe aplicar autenticacion, backoff y alertas. Las pruebas sandbox manuales se ejecutan al disponer de credenciales de prueba.
