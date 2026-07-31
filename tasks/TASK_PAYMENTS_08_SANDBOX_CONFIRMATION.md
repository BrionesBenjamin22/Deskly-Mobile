| Campo | Contenido |
|---|---|
| `ID` | `PAYMENTS-08` |
| `Modulo` | Backend y mobile: Payments |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `PAYMENTS-07`; simulacion manual del usuario para cerrar transporte sandbox |
| `Implementacion` | `backend/src/modules/payments`, `mobile/src/features/payments`, configuracion y documentacion |
| `Validacion` | Tests focales y completos, E2E, builds, Expo, Docker, `git diff --check` y simulador oficial diferido |

# Confirmacion resiliente de pagos sandbox

## Objetivo

Evitar que los intentos sandbox dependan de una notificacion automatica que
Mercado Pago no emite con credenciales de prueba, manteniendo el webhook como
fuente primaria en produccion y la conciliacion autoritativa como respaldo.

## Contexto inspeccionado

- La preferencia configura `back_urls`, pero no `notification_url`.
- El webhook firmado, la sincronizacion por referencia y la conciliacion
  administrativa ya existen.
- Mobile consulta estados no terminales y nunca aprueba por retorno visual.
- La documentacion oficial indica usar el simulador para credenciales de prueba.

## Riesgos heredados

- Nunca aprobar por `back_urls`, query del navegador o estado informado por mobile.
- No versionar token, secreto, firma ni URL efimera real.
- No fabricar firmas fuera de tests deterministas.
- Evitar conciliaciones superpuestas y consultas externas sin limite.
- Webhooks y retornos del proveedor deben permanecer publicos.

## Alcance

1. Configurar y enviar `MERCADO_PAGO_NOTIFICATION_URL`.
2. Fortalecer la conciliacion de pagos sin ID externo mediante referencia.
3. Automatizar lotes acotados con configuracion desactivable y sin solapamiento.
4. Mantener polling mobile acotado y feedback explicito.
5. Registrar metricas operativas seguras en logs estructurados.

## Fuera de alcance

- Ejecutar la simulacion oficial con credenciales del usuario.
- Declarar aprobado un pago por retorno visual.
- Incorporar un secreto o credencial real al repositorio.
- Cerrar `PAYMENTS-07` antes de la validacion manual acordada.

## Secuencia test-first

1. Exigir `notification_url` HTTPS y su inclusion en la preferencia.
2. Caracterizar conciliacion por referencia cuando no existe payment ID.
3. Probar worker deshabilitado, ejecucion periodica y bloqueo de solapamiento.
4. Caracterizar polling y mensajes de estados no terminales.
5. Ejecutar barrera completa y documentar la prueba manual diferida.

## Criterios de cierre

- Toda preferencia Mercado Pago contiene una URL de webhook validada.
- Un pago sin webhook puede sincronizarse autoritativamente por referencia.
- La automatizacion no ejecuta dos lotes simultaneos.
- Mobile no presenta confirmacion hasta que backend informa `APPROVED`.
- Toda evidencia automatizable aprueba.
- La simulacion manual queda explicitamente diferida, no aprobada.

## Evidencia

- Configuracion y gateway Mercado Pago: 2 suites, 37 pruebas aprobadas.
- Conciliacion y worker: 2 suites, 11 pruebas aprobadas.
- Modulo Payments backend: 23 suites, 167 pruebas aprobadas tras el ajuste del
  contrato de query del simulador.
- Backend completo: 53 suites, 321 pruebas aprobadas.
- E2E con PostgreSQL limpio y 18 migraciones: 3 suites, 17 pruebas aprobadas.
- Mobile completo: 22 suites, 85 pruebas aprobadas.
- Build backend, TypeScript mobile y export Expo web aprobados.
- Prettier, ESLint focal y `git diff --check` aprobados.
- Build Docker de backend y mobile aprobado.
- Database, backend y mobile saludables; `/health` respondio 200 y Metro
  informo `packager-status:running`.
- Simulacion oficial con un pago sandbox real: diferida a solicitud del usuario.
- Confirmacion visual y cierre de `PAYMENTS-07`: pendientes de esa simulacion.
- Pago `170515659197` recuperado autoritativamente y aplicado como `APPROVED`
  mediante conciliacion; esto valida el respaldo sin declarar recibido el webhook.
- Se corrigio la verificacion HMAC para usar `data.id` de query, como exige el
  contrato oficial, y admitir el body vacio mostrado por el simulador sin
  debilitar firma ni validacion cruzada.
- El simulador continuo informando timeout y ngrok no registro la solicitud;
  luego de corregir la configuracion externa se repitio la entrega con exito.
- Evidencia manual final: ngrok recibio
  `POST /webhooks/payments?data.id=170515659197&type=payment` desde
  `restclient-node/5.3.0`, con `x-request-id` y `x-signature`, y respondio 200.
- Deskly registro un unico evento externo y mantuvo el pago correlacionado en
  `APPROVED`; la conciliacion previa y el webhook convergieron sin duplicar la
  transicion financiera.

## Mensajes de commit propuestos

- `feat(pagos): configurar notificaciones por preferencia`
- `feat(pagos): automatizar conciliacion de pagos pendientes`
- `docs(pagos): registrar validacion sandbox pendiente`
