# Pruebas del modulo Payments

## Alcance

La etapa 3 se valida en tres niveles:

- Dominio: dinero, politica de precios, transiciones e idempotencia.
- Aplicacion e infraestructura: propiedad, estados pagables, concurrencia, repositorio y gateway fake.
- E2E con PostgreSQL: autenticacion, whitelist del payload, idempotencia persistida y permisos.

## Casos cubiertos

- Seña del 30% y pago total calculados exclusivamente en backend.
- Rechazo de `amount` y otros campos no permitidos.
- Reserva inexistente, ajena, no pagable o con pago aprobado.
- Reutilizacion secuencial de la misma clave.
- Coordinacion concurrente con una sola creacion externa.
- Conflicto al reutilizar la clave con otros datos.
- Hold de 15 minutos sin confirmar la reserva.
- Liberacion del hold ante fallo definitivo.
- Conservacion del intento ante errores reintentables.
- Consulta por propietario y acceso operativo de ADMIN/GESTOR.
- Rechazo sin JWT y respuesta segura ante errores del proveedor.

## Comandos

Desde `/backend`:

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand test/payments-integration.e2e-spec.ts
```

La prueba E2E crea usuarios, miembros, localidad, area, escritorio y reserva aislados. Al finalizar elimina pagos, eventos y todos los datos auxiliares creados por la prueba.

Antes de ejecutar contra una base local, aplicar las migraciones versionadas:

```bash
npx prisma migrate deploy
```

## Prueba manual

```bash
curl -X POST http://localhost:3000/payments/checkout \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: checkout-reserva-001" \
  -H "Content-Type: application/json" \
  -d '{"reservationId":"550e8400-e29b-41d4-a716-446655440001","option":"DEPOSIT"}'
```

Repetir exactamente la solicitud debe devolver el mismo `paymentId` y la misma `checkoutUrl`.
