# Validacion manual sandbox de Payments

## Precondiciones

- Credenciales de prueba de Mercado Pago cargadas solo en backend.
- `PAYMENT_GATEWAY=MERCADO_PAGO`.
- Backend y frontend accesibles mediante las URLs configuradas.
- Webhook HTTPS registrado con secreto de prueba.
- `MERCADO_PAGO_NOTIFICATION_URL` apunta a la misma URL y contiene
  `source_news=webhooks`.
- Usuario de prueba con miembro y una reserva pagable.

No copiar tokens, secretos, firmas completas o payloads con datos personales en este documento ni en evidencias.

## Procedimiento

1. Iniciar backend, mobile web y una plataforma native de prueba.
2. Crear una reserva y confirmar que no se crea un pago CRUD ni se muestra como abonada.
3. Abrir `Pagos`, solicitar cotizacion y comparar seña/total con la respuesta de `GET /reservations/:id/payment-quote`.
4. Elegir una opcion y comprobar que `POST /payments/checkout` envia solo `reservationId` y `option`, con JWT e `Idempotency-Key`.
5. Pulsar dos veces la accion y verificar un solo intento/checkout.
6. Abrir la URL HTTPS en web y native.
7. Volver sin pagar y confirmar que la UI sigue `PENDING`; el retorno no debe mostrar exito.
8. Completar un pago sandbox, obtener su ID y usar el simulador oficial de
   Webhooks para entregar el evento firmado. Los pagos con credenciales de
   prueba no deben documentarse como notificacion automatica recibida.
9. Confirmar que el polling o la accion `Actualizar estados` muestra `APPROVED` y que la reserva queda confirmada.
10. Reentregar el mismo webhook y verificar un solo evento efectivo.
11. Repetir con rechazo o vencimiento y confirmar mensaje/accion coherentes.
12. Revisar logs: no deben contener token, secreto, firma, body completo ni query sensible.

## Evidencia requerida para cerrar PAYMENTS-07

- Fecha, plataforma web/native y ambiente sandbox.
- IDs locales de reserva/pago truncados; nunca IDs o secretos externos completos.
- Resultado de cada paso, sin capturas que expongan datos sensibles.
- Confirmacion de un intento, un evento efectivo y una transicion de reserva.
- Incidentes detectados y su resolucion.

## Contrato de webhook a corroborar

```http
POST /webhooks/payments
Content-Type: application/json
x-signature: ts=<timestamp>,v1=<hmac-sha256-hex>
x-request-id: <identificador>
```

La solicitud debe incluir `?data.id=<payment_id>&type=payment`. El `data.id`
de query es el valor firmado; si el body tambien lo informa, ambos deben
coincidir. El simulador puede representar la solicitud como `{}` y sigue siendo
valida solamente cuando la query y los headers firmados estan presentes.

```json
{
  "id": 987654321,
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

El body solo aporta IDs y tipo. El backend consulta al proveedor y valida referencia, monto, moneda y estado antes de aplicar cambios.
