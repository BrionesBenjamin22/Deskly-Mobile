# Etapa 7: frontend, documentacion y cierre

| Campo | Valor |
|---|---|
| ID | `PAYMENTS-07` |
| Modulo | Payments mobile y documentacion |
| Estado | `PENDIENTE` |
| Dependencia | `PAYMENTS-06` |
| Implementacion | `mobile/src/features/payments` y `backend/src/modules/payments` |

## Objetivo

Integrar el checkout seguro en Expo web/mobile, eliminar calculos monetarios autoritativos del cliente y cerrar documentacion tecnica y operativa.

## Riesgos heredados obligatorios

| Riesgo de Etapa 6 | Correccion obligatoria en Etapa 7 | Evidencia |
|---|---|---|
| Frontend aun usa CRUD y confirma por respuesta local | Consumir checkout/estado y esperar backend | Tests de UI/service |
| Precio y saldo se calculan en mobile | Renderizar cotizacion backend sin usarla como autoridad | Tests sin constantes locales |
| No existe operacion documentada | Documentar sandbox, webhooks, conciliacion y diagnostico | READMEs revisados |
| Configuracion productiva no tiene checklist final | Documentar secretos, HTTPS y despliegue | Checklist ejecutado |

## Tareas backend

### D7-01: documentacion tecnica

- Actualizar README de Payments con modelo, estados, transiciones y endpoints.
- Documentar DTOs, errores seguros, roles e idempotencia.
- Documentar variables sin valores reales.
- Documentar migracion y compatibilidad de datos historicos.

### D7-02: operacion

- Configuracion sandbox y productiva.
- Registro de URL HTTPS y webhook secret.
- Rotacion de credenciales.
- Conciliacion de pendientes y diagnostico de inconsistencias.
- Procedimiento ante proveedor caido y reentregas.
- Riesgos conocidos y alcance de reembolsos.

## Tareas frontend

### F7-01: service y tipos

- Service dedicado autenticado.
- Tipos para cotizacion, intento, checkout y estado.
- `PaymentServiceError` con `Object.setPrototypeOf` y deteccion doble.
- Idempotency key generada una vez por accion y reutilizada en reintentos.
- No enviar monto, moneda, memberId ni estado.

### F7-02: flujo de reserva y checkout

- Mostrar opciones seña o total usando cotizacion backend.
- Eliminar monto personalizado.
- Abrir checkout hospedado mediante mecanismo compatible con Expo web/mobile.
- La URL de retorno solo dirige a una pantalla de estado.
- Consultar backend hasta estado terminal con espera acotada y accion manual de reintento.
- Mostrar reserva confirmada solo cuando backend informe `APPROVED`/`RESERVED`.

### F7-03: pantalla de pagos

- Consumir pagos autorizados del usuario.
- Mostrar intento, monto exacto, moneda y estado normalizado.
- No sumar pagos pendientes/rechazados como abonados.
- Estados vacio, carga, error, pendiente, rechazado, vencido y aprobado.
- Mantener paginacion de 9 elementos.

### F7-04: accesibilidad y seguridad

- Feedback claro sin falsa confirmacion.
- Botones deshabilitados durante inicio de checkout.
- Labels accesibles y diseño responsive.
- No renderizar IDs externos innecesarios ni errores crudos.
- No guardar credenciales o payloads del proveedor.

### F7-05: pruebas

- Service no envia monto.
- Doble toque reutiliza operacion o queda bloqueado.
- Retorno exitoso sin webhook sigue pendiente.
- Webhook aprobado actualiza UI tras consulta.
- Rechazo, cancelacion y expiracion permiten accion coherente.
- Web y native abren checkout sin exponer secretos.
- Regresion de reservas, navegacion y pagos.

## Archivos sensibles

`App.tsx`, layout global, auth, hooks compartidos y componentes globales no deben modificarse sin autorizacion especifica. El diseño debe priorizar cambios dentro de `features/payments` y adaptaciones acotadas del flujo de reserva.

## Validacion final

```text
suite completa backend
suite completa mobile
build backend
TypeScript mobile
export web
migraciones desde base limpia
prueba manual sandbox con credenciales de prueba
busqueda de secretos y datos sensibles
```

## Criterios de cierre

- El frontend nunca confirma por URL de retorno.
- No existen constantes monetarias autoritativas en mobile.
- Toda documentacion estable coincide con el contrato real.
- No hay secretos versionados.
- Todos los riesgos heredados estan cerrados.
- Se entrega resumen final y mensajes de commit, sin ejecutar commits.

## Commit sugerido

`docs(payments): document payment flow and operational safeguards`
