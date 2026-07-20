# Etapa 3: creacion idempotente del pago

## Objetivo

Implementar el flujo autenticado que crea una reserva pendiente y un intento de checkout fake, calculando siempre el importe en backend.

## Riesgos heredados obligatorios

| Riesgo de Etapa 2 | Correccion obligatoria en Etapa 3 | Evidencia |
|---|---|---|
| Endpoints CRUD legados siguen publicos | Sustituirlos por endpoints autenticados y eliminar `DELETE` del contrato | Tests 401/403 y Swagger |
| Schema permite `PENDING_PAYMENT`, pero el flujo no lo usa | Crear hold pendiente y confirmar solo por webhook posterior | Tests de caso de uso |
| Politica de precio aun no se aplica al alta | Calcular duracion, total y seña en backend | Tests de manipulacion de monto |
| Repositorio tiene idempotencia, pero el caso de uso no la coordina | Resolver repeticion, fingerprint y concurrencia antes del gateway | Tests secuenciales/concurrentes |
| Reserva y pago pueden quedar parcialmente creados | Definir transaccion local y compensacion ante fallo externo | Tests de rollback/timeout |
| La prueba transaccional de constraints con PostgreSQL real no pudo ejecutarse porque la base estaba vacia de reservas | Crear datos auxiliares aislados dentro de una transaccion con rollback y probar idempotencia concurrente, evento duplicado y doble aprobacion | Test de integracion reproducible contra PostgreSQL real, con datos autocontenidos, ejecucion concurrente y rollback confirmado |

## Tareas

### C3-01: definir contratos HTTP minimos

- `POST /payments/checkout` autenticado.
- Body: `reservationId` o datos aprobados para crear el hold, y `option` (`DEPOSIT` o `FULL`).
- Header obligatorio `Idempotency-Key` con formato y longitud acotados.
- No aceptar monto, moneda, precio por hora, porcentaje, estado ni memberId.
- `GET /payments/:id` autenticado y autorizado por propietario o rol operativo.
- `GET /reservations/:id/payments` autenticado con el mismo criterio.

### C3-02: establecer propiedad y estado pagable

- Obtener miembro desde JWT.
- Verificar que la reserva pertenezca al miembro.
- Rechazar reserva inexistente, ajena, cancelada, completada o con pago aprobado suficiente.
- Permitir multiples intentos solo si no existe otro checkout vigente incompatible.

### C3-03: calcular precio en backend

- Calcular minutos desde la reserva persistida.
- Aplicar `PaymentPricingPolicy` versionada.
- Guardar total, monto pagable, opcion y version como snapshot.
- Ignorar/rechazar cualquier campo monetario adicional por whitelist.

### C3-04: coordinar idempotencia

- Calcular fingerprint estable de usuario, reserva, opcion y version de precio.
- Si clave y fingerprint coinciden, devolver el intento previo.
- Si la clave coincide con otro fingerprint, responder conflicto seguro.
- Antes de llamar al gateway, reservar la operacion persistentemente.
- En reintento tras timeout, consultar/reutilizar la operacion y no crear otro pago externo.

### C3-05: crear hold y checkout fake

- Crear o adaptar la reserva a `PENDING_PAYMENT` con vencimiento a 15 minutos.
- Invocar `PaymentGatewayPort` con referencia interna, centavos, ARS y expiracion.
- Persistir ID externo y checkout URL segura.
- No cambiar a `RESERVED` por respuesta de creacion del checkout.

### C3-06: retirar comportamiento legado

- Retirar alta con `date` y `amount` del cliente.
- Retirar listado global publico.
- Retirar borrado fisico y su caso de uso.
- Adaptar tests y documentacion del contrato; no mantener rutas inseguras por compatibilidad.

### C3-07: pruebas

- Creacion valida con fake.
- Reserva inexistente, ajena o no pagable.
- Seña y total calculados por backend.
- Campo `amount` rechazado.
- Misma clave/mismos datos secuencial y concurrente.
- Misma clave/datos diferentes.
- Timeout antes y despues de crear checkout.
- Una sola llamada externa.
- Sin autenticacion, rol/propiedad incorrectos y payloads no permitidos.
- Error del fake sanitizado.

## Impacto externo autorizado

Se modificaran reservas solo para usar el estado `PENDING_PAYMENT`, el hold de 15 minutos y la propiedad ya aprobada. No se alteraran cancelacion, check-in, penalizaciones ni navegacion.

## Criterios de cierre

- Ningun endpoint de pagos de usuario queda publico.
- El cliente no controla importes.
- Un doble clic no crea dos pagos locales ni externos.
- Una reserva no queda confirmada antes del pago.
- Todos los riesgos heredados estan cerrados.

## Estado de cierre

Etapa completada.

- Contratos publicos legados retirados; todos los endpoints actuales requieren JWT.
- Importe, moneda, opcion y version de precio se calculan o validan en backend.
- Intento y hold se crean en una unica transaccion PostgreSQL con rollback comprobado.
- La clave y el fingerprint resuelven reintentos secuenciales, concurrentes y conflictos.
- Los timeouts anteriores y posteriores a la creacion externa reutilizan la operacion.
- Los fallos definitivos rechazan el intento y liberan el hold.
- La reserva permanece `PENDING_PAYMENT`; solo un webhook posterior podra confirmarla.
- Build, suite unitaria y E2E PostgreSQL quedan como evidencia reproducible en `TESTING.md`.

## Commit sugerido

`feat(pagos): cerrar la creacion idempotente y transaccional de pagos`
