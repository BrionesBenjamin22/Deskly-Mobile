# Etapa 7: frontend, documentacion y cierre

| Campo          | Valor                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | `PAYMENTS-07`                                                                                                                                                                          |
| Modulo         | Payments mobile y documentacion                                                                                                                                                        |
| Estado         | `EN_PROGRESO`                                                                                                                                                                          |
| Dependencia    | `PAYMENTS-06` y prueba manual sandbox                                                                                                                                                  |
| Implementacion | `mobile/src/features/payments` y `backend/src/modules/payments`                                                                                                                        |
| Validacion     | Formato, build backend, unitarios y E2E, suite mobile, TypeScript, export web, migraciones limpias, busqueda de secretos y prueba manual sandbox cuando existan credenciales de prueba |

## Objetivo

Integrar el checkout seguro en Expo web/mobile, eliminar calculos monetarios autoritativos del cliente y cerrar documentacion tecnica y operativa.

## Riesgos heredados obligatorios

| Riesgo de Etapa 6                                    | Correccion obligatoria en Etapa 7                        | Evidencia                    |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------- |
| Frontend aun usa CRUD y confirma por respuesta local | Consumir checkout/estado y esperar backend               | Tests de UI/service          |
| Precio y saldo se calculan en mobile                 | Renderizar cotizacion backend sin usarla como autoridad  | Tests sin constantes locales |
| No existe operacion documentada                      | Documentar sandbox, webhooks, conciliacion y diagnostico | READMEs revisados            |
| Configuracion productiva no tiene checklist final    | Documentar secretos, HTTPS y despliegue                  | Checklist ejecutado          |

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

## Evidencia automatizada (2026-07-21)

- Backend completo: 40 suites, 231 pruebas aprobadas.
- E2E PostgreSQL: 2 suites, 8 pruebas aprobadas, incluida cotizacion autenticada y rechazo de propietario incorrecto.
- Mobile completo: 9 suites, 32 pruebas aprobadas.
- TypeScript mobile: aprobado.
- Build backend: aprobado.
- Export web Expo: aprobado, 2101 modulos, bundle, `index.html` y assets; artefactos temporales eliminados.
- Docker Compose: PostgreSQL saludable.
- Migraciones: 17 aplicadas desde cero en base temporal y base eliminada.
- `git diff --check`: aprobado.
- Busqueda de secretos y contratos inseguros: sin credenciales versionadas, sin constantes monetarias mobile, sin monto personalizado y sin llamadas al CRUD anterior.
- Contrato `Linking.openURL`: verificado contra documentacion oficial de React Native; se valida HTTPS antes de abrir.
- SDK oficial Mercado Pago: `mercadopago@3.2.0` integrado en backend mediante `Preference`, `Payment` y `PaymentRefund`; el gateway fake permanece para pruebas deterministas.
- Gateway Mercado Pago con SDK: 1 suite, 23 pruebas aprobadas, incluyendo payload, idempotencia, estados, errores sanitizados, HMAC y reembolso.
- Revision posterior al SDK: backend completo 40 suites/231 pruebas, E2E 2 suites/8 pruebas, build, formato, lint focalizado y `git diff --check` aprobados.
- La remediacion de la auditoria productiva se completo en `SECURITY-01`; ya no bloquea esta etapa.

## Ajuste de flujo iniciado el 23 de julio de 2026

- El alta crea un hold tecnico `PENDING_PAYMENT`; no expone una reserva confirmada antes del pago.
- Escritorios encadena alta, cotizacion, checkout HTTPS y consulta del estado backend.
- Un pago aprobado confirma la reserva. Una seña aprobada habilita completar solamente el saldo desde Pagos.
- Pagos conserva su composicion de tarjetas y recupera la tarjeta superior con el total pendiente.
- La disponibilidad contempla holds pendientes y la restriccion PostgreSQL existente protege solapamientos concurrentes para `PENDING_PAYMENT`, `RESERVED` y `ACTIVE`.
- Evidencia parcial: 3 suites focalizadas de dominio con 22 pruebas, 2 suites de persistencia/caso de uso con 22 pruebas, prueba de pantalla Pagos con 2 pruebas, build backend y TypeScript mobile aprobados.
- Suite completa final posterior al ajuste: backend 41 suites/243 pruebas y mobile 9 suites/32 pruebas aprobadas.
- E2E PostgreSQL: 2 suites/8 pruebas aprobadas sobre una base temporal limpia; 17 migraciones aplicadas y la base fue eliminada al finalizar.
- Build backend, TypeScript mobile, formato de archivos modificados y export web Expo con 2101 modulos aprobados.
- Diagnostico sandbox real: credencial reconocida, preferencia creada por SDK, dominio `sandbox.mercadopago.com.ar` incorporado a la allowlist y checkout con 15 minutos de vigencia despues de sincronizar el reloj local.
- Compra sandbox real completada. Se corrigio la distincion entre ID de preferencia e ID de pago: el webhook correlaciona por referencia unica, valida datos autoritativos y enlaza el pago real. La seña recuperada quedo `APPROVED` y su reserva `RESERVED`.
- El polling mobile permanece activo hasta el vencimiento del checkout para mostrar confirmacion despues de volver del proveedor y refrescar Pagos.
- La investigacion posterior sobre URLs de Expo, dispositivos y posible API gateway se registro como `INFRA-01` sin modificar configuracion global.

## Correccion de confirmacion iniciada el 24 de julio de 2026

- Se reprodujo el bloqueo: el polling consultaba solamente el intento local y una preferencia no posee todavia el ID real del pago. Sin webhook, el intento permanecia `PENDING`.
- `PaymentGatewayPort` incorpora busqueda por referencia externa. El adaptador oficial usa `Payment.search` y valida referencia exacta, importe ARS y moneda antes de vincular el ID externo.
- Las consultas autenticadas de intento y por reserva sincronizan estados no terminales. `APPROVED` se guarda mediante la transaccion existente que confirma la reserva; el retorno visual nunca aprueba.
- Se implementaron `GET /payments/return/success`, `pending` y `failure` como pagina estatica de cierre del checkout. No procesa IDs, importes ni estados enviados por el navegador.
- Pagos incluye reservas `PENDING_PAYMENT`, `RESERVED` y `ACTIVE`, espera la sincronizacion antes de pedir la cotizacion y pagina localmente 9 resultados aprobados.
- Reservas prioriza estados vigentes en backend antes de paginar y en mobile presenta activas, pendientes de pago y reservadas antes de finalizadas y canceladas.
- Evidencia focalizada: backend 3 suites/36 pruebas y mobile 2 suites/3 pruebas aprobadas.
- Evidencia completa: backend 42 suites/251 pruebas; mobile 13 suites/40 pruebas; E2E PostgreSQL 2 suites/8 pruebas sobre 17 migraciones limpias; build backend, TypeScript mobile, lint focalizado y export web con 2101 modulos aprobados.
- La base Docker de desarrollo inspeccionada estaba saludable pero vacia; no contenia la reserva real del 1 de agosto, por lo que la correccion se valido de forma determinista sin modificar datos del usuario.

## Validacion manual pendiente

- Repetir una compra sandbox con la correccion para validar la pagina de retorno, el mensaje de confirmacion, la aparicion en Pagos y el saldo restante de una seña.

- retorno desde Mercado Pago con mensaje “Reserva confirmada” luego de pagar.
- aparición de la reserva en Pagos.
- visualización y pago del saldo restante después de una seña.

El bloqueo actual es externo: el sandbox limita el acceso por exceso de redirecciones. Como ya comprobaste creación del checkout, impacto en
cuentas fake, webhook y aprobación de la reserva, esta prueba puede documentarse como diferida. La medición de calidad productiva quedará para
cuando exista un pago real de producción.

## Ajuste UX de saldo pendiente del 31 de julio de 2026

- `Completar pago` abre las mismas opciones de cotizacion en un modal centrado,
  en lugar de insertar una tarjeta al final del listado.
- Se conservaron cotizacion backend, importes, idempotencia, checkout y polling.
- El modal se puede cancelar sin llamadas adicionales y bloquea acciones durante
  el inicio del checkout.
- Evidencia focal: 1 suite y 5 pruebas aprobadas.
- Mobile completo: 22 suites y 86 pruebas aprobadas; TypeScript y formato de
  archivos modificados aprobados.
- Se agregaron filtros `Todos`, `Pendientes` y `Completados`; backend filtra
  antes de paginar y mobile reinicia en pagina 1 al cambiar de vista.
- Evidencia focal del filtro: backend 3 suites/9 pruebas y mobile 3 suites/12
  pruebas; builds y TypeScript aprobados.
- Barrera completa posterior: backend 53 suites/325 pruebas y mobile 22
  suites/87 pruebas; build backend, TypeScript y `git diff --check` aprobados.

## Commit sugerido

Al completar la prueba manual: `feat(pagos): integrar checkout seguro y documentar su operacion`
