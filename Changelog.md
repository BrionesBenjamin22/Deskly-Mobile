# Changelog de Deskly

## Proposito y criterio de trazabilidad

Este documento registra las entregas funcionales de Deskly por separado. Resume
el objetivo de cada entrega, las funcionalidades desarrolladas, las decisiones
técnicas, los errores corregidos, las validaciones ejecutadas y los pendientes
conocidos.

Las fuentes utilizadas para reconstruirlo son:

- historial de Git y ramas `entrega-1`, `entrega-2`, `dev` y `main`;
- TDDs funcionales del directorio `docs/TDDs`;
- registro canónico de `/tasks`;
- documentación técnica de `backend` y `mobile`;
- bitácoras `CONVERSACIONES.md` y
  `docs/conversacion-agente-implementacion-mvp.md`;
- PR #8, titulado
  `feat: Consolidar aplicación con mejoras acordes a la entrega 3`;
- comentarios y aprobaciones de revisión disponibles en GitHub.

No se presenta como completada una tarea que el registro canónico mantenga
pendiente o en progreso. Las cantidades de pruebas corresponden a la evidencia
registrada al cierre de cada bloque y pueden variar entre etapas por la
incorporación posterior de nuevas suites.

---

## Entrega 1 — MVP de escritorios y reservas

### Periodo y alcance

- Periodo principal: 29 de abril al 4 de junio de 2026.
- Rama de entrega: `entrega-1`.
- Integración: PR #2.
- Objetivo: establecer la base técnica del producto y entregar un flujo
  funcional de consulta, reserva y administración inicial de escritorios.

### Base del proyecto

- Se inicializó la aplicación Deskly con backend NestJS, aplicación Expo/React
  Native y base PostgreSQL.
- Se configuró Prisma, generación del cliente, migraciones y scripts de
  ejecución.
- Se adoptó una arquitectura modular con separación de dominio, aplicación,
  infraestructura e interfaces.
- Se documentó el MVP mediante los TDD-0001 a TDD-0005.
- Se incorporó soporte de ejecución web en Expo.

### Escritorios

- CRUD de escritorios con listado paginado, detalle, edición y baja lógica.
- Consulta de disponibilidad por fecha y franja horaria.
- Exclusión de escritorios deshabilitados o eliminados.
- Modelo ampliado con:
  - zonas `A`, `B` y `C`;
  - descripciones reutilizables;
  - capacidad de personas;
  - amenities reutilizables;
  - relación muchos-a-muchos entre escritorios y amenities.
- CRUD de descripciones y amenities.
- Protección de eliminación para catálogos asociados a escritorios.
- Formularios mobile con validaciones, feedback y visualización del catálogo.

### Reservas

- Alta, listado, detalle, edición y cancelación lógica de reservas.
- Prevención de solapamientos activos mediante una restricción de PostgreSQL.
- Estados iniciales de reserva y liberación de disponibilidad al cancelar.
- Respuesta de alta preparada para mostrar una confirmación visual.
- Pantalla `Mis reservas`, inicialmente desarrollada con datos de prueba y luego
  conectada al backend.
- Confirmación visible de operaciones y manejo de conflictos de disponibilidad.

### Decisiones y correcciones relevantes

- En esta entrega se excluyó intencionalmente la relación con usuarios.
- `DELETE` no elimina físicamente escritorios ni reservas.
- Se corrigió la carga de variables de entorno de Prisma.
- Se reemplazó el cliente Prisma generado localmente por `@prisma/client` para
  resolver incompatibilidades de módulos.
- Se alineó `start:prod` con la salida real `dist/src/main`.
- La migración de zona, descripción y amenities fue generada por Prisma después
  de limpiar los datos incompatibles; no se escribió manualmente.
- Se estabilizó el contrato de conflicto con HTTP `409`.

### Validación registrada

- Build, lint, tests unitarios y estado de migraciones aprobados.
- Cierre histórico documentado: 6 suites, 27 pruebas y 4 migraciones.
- Se realizaron comprobaciones manuales del CRUD, disponibilidad, reserva,
  cancelación y respuesta posterior a una baja lógica.

### Pendientes transferidos a la Entrega 2

- Autenticación y autorización.
- Asociación de reservas con miembros.
- Privacidad por propietario.
- Gestión de usuarios y roles.
- Flujo operativo de gestores.
- Penalizaciones.

---

## Entrega 2 — Autenticación, roles y operación de usuarios

### Periodo y alcance

- Periodo principal: 22 al 24 de junio de 2026.
- Punto de cierre en Git: merge `64a7208`.
- Objetivo: incorporar identidad, permisos y operación multirol sobre el MVP.

### Autenticación y perfil

- Registro e inicio de sesión con JWT.
- Endpoint de usuario autenticado y actualización de perfil.
- Cambio de contraseña con validación de contraseña actual.
- Reglas de contraseña: longitud, mayúscula y número.
- Respuestas diferenciadas para:
  - credenciales incorrectas;
  - cuenta desactivada mediante `ACCOUNT_INACTIVE`;
  - cuenta bloqueada temporalmente mediante `blockedUntil`.
- Modales de estado específicos para cada error de autenticación.
- Corrección de las clases custom de error en React Native mediante
  `Object.setPrototypeOf`.
- Detección defensiva de errores por `instanceof` y por `error.name`.

### Roles y usuarios

- Roles `ADMIN`, `GESTOR` y `MIEMBRO`.
- Guards JWT y de roles en backend.
- Gestión administrativa de usuarios, cambio de rol, restauración de acceso y
  baja lógica.
- Restricción de acciones visibles en mobile según rol.
- Perfil editable para gestor y miembro; perfil administrativo de solo lectura.

### Reservas y operación

- Asociación de reservas al miembro autenticado.
- Miembros limitados a sus propias reservas.
- Gestores habilitados para consultar reservas operativas, validar llegada y
  registrar ausencia.
- Ciclo ampliado de estados de reservas.
- Cancelación y acciones operativas con permisos.
- Penalizaciones por ausencia y bloqueo temporal de cuentas.
- Restauración administrativa de cuentas bloqueadas o desactivadas.

### Navegación y UX

- Navegación state-based centralizada en `App.tsx`.
- Propagación explícita de callbacks y token de sesión.
- `ChangePasswordModal` global administrado desde `App.tsx`.
- Reutilización de calendario y selector de fecha entre escritorios y reservas.
- Mejoras de modales, formularios y feedback.

### Infraestructura

- Imagen Docker multi-stage para preparar ejecución y despliegue.
- Conservación de la compatibilidad con PostgreSQL, Prisma y Expo.

### Correcciones relevantes

- Se admitieron teléfonos de mayor longitud.
- Se corrigió la vinculación entre reserva y miembro autenticado.
- Se unificó el formato de fecha utilizado al crear pagos.
- Se estabilizó la navegación autenticada al integrar cambios de distintas
  features.

### Pendientes transferidos a la Entrega 3

- Localidades y áreas de trabajo.
- Ubicación geográfica y mapas.
- Flujo de pago real previo a la confirmación.
- Seguridad de integraciones externas.
- Persistencia segura de sesión mobile.
- CI/CD, hardening de Docker y conectividad Expo.
- Panel administrativo de catálogos.

---

## Entrega 3 — Áreas, pagos, seguridad e infraestructura

### Identificación formal

- Periodo de desarrollo: 24 de junio al 27 de julio de 2026.
- PR de entrega: #8.
- Título: `feat: Consolidar aplicación con mejoras acordes a la entrega 3`.
- Rama origen: `dev`.
- Rama destino: `main`.
- PR creado: 27 de julio de 2026.
- PR aprobado y fusionado: 28 de julio de 2026.
- Magnitud informada por GitHub: 92 commits, 364 archivos modificados,
  33.297 adiciones y 2.004 eliminaciones.
- Revisores que aprobaron: `WilliamsIgnacio` y `avilugo110`.

### 1. Localidades, áreas de trabajo y disponibilidad

- Se incorporaron entidades de localidad y área de trabajo.
- Cada área puede incluir nombre, localidad, dirección, latitud y longitud.
- Los escritorios se asociaron a áreas de trabajo.
- Se validó en backend que localidad y área estén activas al consultar o
  reservar.
- Se agregaron filtros de disponibilidad por localidad y área.
- Mobile incorporó:
  - selector de localidad;
  - secciones y tarjetas de áreas;
  - pantalla dedicada de áreas de trabajo;
  - selección de área antes de elegir escritorio;
  - filtros de fecha y horario;
  - estados de carga, error y vacío.
- Se evitó el patrón N+1: los datos relacionados se obtienen en la respuesta
  principal y no mediante una consulta por tarjeta.

### 2. Ubicación en reservas y mapas

- El contrato de reservas expone la relación
  `Reservation -> Desk -> WorkArea -> Locality`.
- La ubicación se mantiene opcional para tolerar datos históricos o respuestas
  parciales.
- Se incorporó un detalle expandible e independiente en cada tarjeta de
  reserva.
- Se muestran área, localidad, dirección y coordenadas cuando son válidas.
- Se implementaron variantes de mapa para web y native.
- Se validaron los rangos geográficos antes de presentar coordenadas.
- Se mantuvieron intactos los flujos de cancelación, check-in, filtros y
  navegación.
- La tarea `MOBILE-RESERVATIONS-LOCATION` quedó `COMPLETADA`.

Evidencia registrada para el cierre del bloque:

- 9 suites y 33 pruebas mobile.
- 41 suites y 243 pruebas backend.
- 2 suites y 8 pruebas E2E con PostgreSQL.
- 17 migraciones aplicadas desde una base limpia.
- Build backend, TypeScript mobile, export Expo web y `git diff --check`
  aprobados.
- Validación manual informada: área y mapa visibles en la tarjeta de reserva.

### 3. Dominio y persistencia de pagos

- Se reemplazó el CRUD de pagos inicial por un dominio explícito de intentos de
  pago.
- Se agregaron estados y transiciones conservadoras.
- Se implementó `Money` y una política de precios autoritativa en backend.
- La moneda autoritativa es ARS.
- Se permiten opciones de seña o pago total calculadas por backend.
- El cliente no puede enviar como autoridad monto, moneda, miembro ni estado.
- Se implementó persistencia de intentos, snapshots monetarios y restricciones
  de idempotencia.
- Se mantuvo un gateway fake obligatorio para pruebas deterministas.

### 4. Creación idempotente y hold de reserva

- La creación genera una reserva técnica `PENDING_PAYMENT`.
- El checkout no expone la reserva como confirmada.
- La clave de idempotencia se reutiliza en reintentos de la misma acción.
- Doble toque, reintento o concurrencia no deben producir múltiples cargos ni
  múltiples reservas.
- La disponibilidad contempla los holds pendientes.
- La restricción PostgreSQL protege solapamientos para `PENDING_PAYMENT`,
  `RESERVED` y `ACTIVE`.
- La reserva cambia a `RESERVED` solo después de un pago aprobado y verificado
  por backend.
- La tarea `PAYMENTS-03` quedó `COMPLETADA`.

### 5. Mercado Pago Checkout Pro

- Se evaluó el contrato oficial y se adoptó el SDK oficial
  `mercadopago@3.2.0`.
- Se integraron `Preference`, `Payment` y `PaymentRefund`.
- Los secretos permanecen exclusivamente en backend.
- Se validan configuración, HTTPS, allowlist de URLs y timeout.
- Se sanitizan errores del proveedor.
- Se agregó idempotencia externa.
- Se distinguen ID de preferencia e ID de pago real.
- Se implementó búsqueda por referencia externa mediante `Payment.search`.
- Se valida referencia, importe y moneda antes de enlazar un pago externo.
- Estados desconocidos nunca se convierten en aprobados.
- La tarea `PAYMENTS-04` quedó `COMPLETADA`.

### 6. Webhooks seguros e idempotentes

- Endpoint dedicado sin JWT, protegido por firma del proveedor.
- Verificación HMAC y comparación en tiempo constante.
- Separación entre verificación de firma, anti-replay y procesamiento
  transaccional.
- El cuerpo del webhook no es fuente autoritativa para importe ni estado.
- El backend consulta el pago real al proveedor.
- Se deduplican eventos y se toleran reentregas.
- Eventos tardíos o fuera de orden no degradan un estado terminal aprobado.
- Pago, evento y reserva se actualizan de manera transaccional.
- Un pago aprobado confirma una sola vez la reserva.
- Rechazo, cancelación o vencimiento conservan reglas explícitas sobre el hold.
- La tarea `PAYMENTS-05` quedó `COMPLETADA`.

### 7. Conciliación y recuperación

- Se agregó conciliación de pagos `PENDING` o `PROCESSING` envejecidos.
- Las consultas autenticadas sincronizan intentos no terminales.
- La confirmación puede recuperarse incluso si el webhook no llega.
- La URL de retorno nunca aprueba el pago.
- Se agregaron páginas estáticas de retorno `success`, `pending` y `failure`.
- Estas páginas no procesan IDs, montos ni estados recibidos del navegador.
- Se registraron reglas de recuperación ante timeout, proveedor caído y
  respuestas tardías.
- Se preservaron logs seguros sin firmas, tokens ni cuerpos completos.

### 8. Frontend de pagos

- Service, tipos y hook dedicados.
- Cotización obtenida del backend.
- Inicio de checkout hospedado mediante una URL HTTPS validada.
- Bloqueo de acciones duplicadas durante la creación.
- Polling acotado y refresco manual.
- Pantalla de pagos con estados vacío, carga, error, pendiente, rechazado,
  vencido y aprobado.
- Paginación local de 9 elementos.
- La seña aprobada permite completar el saldo restante desde Pagos.
- Solo pagos aprobados se computan como abonados.
- El flujo mobile permanece utilizable mientras espera la confirmación.
- `PaymentServiceError` respeta las reglas de errores custom de React Native.

Estado de cierre:

- `PAYMENTS-07` permanece `EN_PROGRESO`.
- La automatización y una compra sandbox real verificaron preferencia, webhook,
  aprobación y cambio de reserva a `RESERVED`.
- Sigue diferida la repetición manual integral del retorno, visualización en
  Pagos y pago de saldo porque el sandbox presentó exceso de redirecciones.

### 9. Administración

- Panel administrativo integrado con la UI existente.
- Gestión de escritorios, tipos, amenities, localidades y áreas de trabajo.
- Altas, ediciones y bajas con confirmación visual.
- Confirmación obligatoria antes de eliminar.
- Asociación y desvinculación de amenities en el mismo formulario.
- Headers JSON y Bearer preservados simultáneamente en mutaciones.
- Navegación inferior adaptada al rol administrador.
- La tarea `ADMIN-01` quedó `COMPLETADA`.

Evidencia registrada:

- 15 suites y 49 pruebas mobile.
- 45 suites y 273 pruebas backend.
- 15 casos de seguridad de endpoints administrativos.
- Build, TypeScript, Expo web, ESLint y Prettier aprobados.
- Alta manual de localidad con sesión ADMIN aprobada.

### 10. Seguridad de autenticación y sesión

- Limitación de intentos en endpoints públicos de autenticación.
- Invalidación de sesiones al cambiar contraseña mediante versionado de token.
- Bootstrap de administrador inicial mediante un comando idempotente y seguro.
- El registro público no permite apropiarse del rol `ADMIN`.
- Persistencia de sesión mobile mediante almacenamiento seguro.
- Restauración de sesión validada contra backend.
- Limpieza local ante token inválido o usuario desactivado.
- Producción mobile exige HTTPS.
- Detalle y edición de reservas protegidos por rol y propiedad.

### 11. Dependencias y cadena de suministro

- Auditoría inicial backend: 33 vulnerabilidades productivas.
- Dependencias backend actualizadas dentro de ramas compatibles.
- Auditoría final backend: 0 vulnerabilidades sobre 303 dependencias
  productivas.
- Auditoría mobile: 0 vulnerabilidades productivas conocidas.
- Acciones de GitHub fijadas por SHA de 40 caracteres.
- `persist-credentials: false` en los checkouts del workflow.
- Credenciales de PostgreSQL y JWT limitadas a jobs que las necesitan.
- Imágenes Node y PostgreSQL fijadas por digest SHA-256.
- Contenedores ejecutados con usuarios no privilegiados.
- Filesystem de solo lectura y capacidades reducidas donde aplica.

### 12. Rate limiting

- Límites diferenciados para creación de checkout, consultas y webhooks.
- Sexto checkout dentro de la ventana configurada rechazado con HTTP `429`.
- Se documentó que el almacenamiento en memoria es válido para una instancia.
- Antes de escalar horizontalmente deberá utilizarse un store distribuido.
- La tarea `SECURITY-08` quedó `COMPLETADA`.

### 13. Entornos, conectividad y Docker

- Archivos de ejemplo separados para desarrollo, testing y producción.
- Una única URL efectiva de API por ejecución mobile.
- Web local usa loopback; Expo Go usa una URL LAN explícita.
- Producción rechaza URLs que no sean HTTPS.
- Backend publicado en `0.0.0.0:3000`.
- Endpoint `/health` mínimo para healthchecks.
- Docker Compose incluye PostgreSQL, migraciones y servicios con healthchecks.
- Se validó conectividad real por loopback y LAN.
- Se corrigió un HTTP `500` detectado en el primer login de Expo Go aplicando
  la migración de `tokenVersion`.
- La tarea `INFRA-01` quedó `COMPLETADA`.
- Un API gateway se descartó por ahora porque existe un único backend modular.

### 14. CI/CD

- Workflow para formato, lint, build, unitarios, E2E PostgreSQL, TypeScript,
  Expo web y Docker.
- PostgreSQL efímero y secretos temporales por job.
- Correcciones específicas para TypeScript y Jest en runners Linux.
- Evidencia local final:
  - 47 suites y 287 pruebas backend;
  - 3 suites y 9 pruebas E2E;
  - 19 suites y 69 pruebas mobile;
  - build backend, TypeScript, export Expo, ESLint y Prettier aprobados.
- `INFRA-02` permanece `EN_PROGRESO` porque su documento conserva pendiente la
  comprobación remota posterior al push, aunque se realizaron tres commits de
  estabilización de CI.

### Bugs y problemas corregidos durante la Entrega 3

1. Contratos de localidad y área inconsistentes entre disponibilidad y reserva.
2. Ubicación incompleta o coordenadas fuera de rango en tarjetas de reserva.
3. Tipos de teclado incompatibles y declaraciones de mapa para TypeScript.
4. Reserva mostrada como confirmada antes de contar con pago verificado.
5. Preferencia de Mercado Pago confundida con el ID de pago real.
6. Pago que permanecía `PENDING` cuando el webhook no llegaba.
7. Polling que bloqueaba la continuidad del flujo mobile.
8. Retorno del navegador usado como señal visual sin reconciliación backend.
9. Orden y paginación que ocultaban reservas vigentes.
10. Acceso a detalle o edición de reservas ajenas.
11. Credenciales estáticas presentes en una versión del workflow de CI.
12. Configuración backend permisiva y URLs HTTP aceptadas en producción mobile.
13. Sesiones antiguas válidas después del cambio de contraseña.
14. Registro inicial capaz de interferir con el bootstrap administrativo.
15. Dependencias productivas vulnerables.
16. Imágenes y acciones CI referenciadas por tags mutables.
17. Expo Go sin una ruta uniforme hacia el backend.
18. Iconos de alertas y estados renderizados de forma inestable.
19. Calendario con selección y desplazamiento poco claros.
20. Rate limiting ausente en operaciones costosas del proveedor.
21. Jest y validaciones automatizadas incompatibles con Linux.

### Revisión de código y remediaciones

#### Revisión humana

- `WilliamsIgnacio`: PR aprobado el 27 de julio de 2026.
- `avilugo110`: PR aprobado el 28 de julio de 2026.
- Las aprobaciones no incluyeron comentarios inline públicos.

#### Revisión automática de secretos

GitGuardian detectó un valor clasificado como contraseña genérica en
`.github/workflows/ci.yml`, introducido en el commit `8cae3c7`. La remediación
incluyó:

- reemplazar credenciales hardcodeadas por secretos o valores temporales
  acotados al job;
- limitar el alcance de `DATABASE_URL` y `JWT_SECRET`;
- evitar persistir credenciales del checkout de Git;
- revisar que no hubiera secretos reales en archivos de entorno versionados;
- conservar solamente ejemplos sin valores sensibles.

El commit de corrección fue:
`chore(ci): reemplazar credenciales por secretos de GitHub`.

#### Revisiones técnicas internas reflejadas en tareas

- Auditoría de autorización y propiedad de reservas.
- Auditoría de DTOs y rechazo de campos desconocidos.
- Auditoría de firma, replay, idempotencia y concurrencia de pagos.
- Auditoría de fallos parciales, conciliación y estados fuera de orden.
- Auditoría de logs, respuestas y exposición de secretos.
- Auditoría de dependencias backend y mobile.
- Auditoría de acciones de GitHub, imágenes Docker y usuarios de contenedor.
- Auditoría de configuración por ambiente, HTTPS y conectividad Expo.
- Revisión de accesibilidad, feedback visible, doble toque y estados vacíos.

### Validación global declarada en el PR #8

- Backend unitario: 47 suites y 287 pruebas aprobadas.
- Backend E2E con PostgreSQL: 3 suites y 9 pruebas aprobadas.
- Mobile: 19 suites y 69 pruebas aprobadas.
- TypeScript mobile aprobado.
- Build backend aprobado.
- Export web de Expo aprobado.
- ESLint y Prettier aprobados.
- Auditorías productivas sin vulnerabilidades conocidas.
- `git diff --check` aprobado.

### Pendientes conocidos de la Entrega 3

- Completar la validación manual integral de Mercado Pago sandbox.
- Finalizar el estado documental de `PAYMENTS-07`.
- Confirmar remotamente la estabilización de CI y cerrar `INFRA-02`.
- Automatizar geocodificación después de seleccionar proveedor; `ADMIN-02`
  continúa `PENDIENTE`.
- Extender auditoría e historial visible a entidades restantes.
- Migrar rate limiting a almacenamiento distribuido antes de usar múltiples
  instancias.
- Completar proxy reverso, TLS, monitoreo y despliegue productivo cloud.

### Auditoría de performance posterior a seguridad

- Se ejecutó una auditoría sobre el commit `9568dbe` después de completar los
  bloques de seguridad.
- Se utilizó PostgreSQL 17 temporal con 1.000 escritorios, 1.000 miembros y
  4.000 reservas sintéticas.
- No se utilizaron datos productivos ni Mercado Pago real.
- Se midieron percentiles, throughput, errores, payload, consultas, build,
  bundle e inicio; memoria se registró como una muestra puntual.
- Se confirmó trabajo redundante en la disponibilidad de áreas: el endpoint
  materializa escritorios y reservas completas para producir una respuesta
  agregada.
- Se confirmó por inspección la cantidad de requests de Pagos; su impacto de
  performance queda como hipótesis hasta medir la pantalla.
- No se modificó código productivo.
- El primer bloque de optimización quedó pendiente de aprobación explícita.
- La línea base y el plan se documentaron en `docs/performance`.
- Tras la aprobación, la disponibilidad de áreas pasó a resolverse mediante una
  consulta agregada parametrizada en PostgreSQL.
- En comparación estricta sobre el mismo fixture, el p95 se redujo entre
  86,88 % y 94,93 %, con 0 errores en 1.560 requests.
- Los payloads anteriores y posteriores fueron idénticos byte por byte.
- Se aprobaron 291 pruebas backend, 9 E2E, el build y la revisión independiente.

---

## Skills utilizadas

### Skills aplicadas en la auditoría de performance

- `commit-work`: revisión de alcance, staged diff y commits aislados de cada
  bloque validado.

### Bloque P2 de performance

- Se agregó un resumen autenticado y paginado de pagos con límite de 9.
- Mobile reemplazó el fan-out de reservas, intentos y cotizaciones por una
  solicitud por página.
- Para 50 reservas, el conteo reproducible pasó de 103 solicitudes a 1:
  diferencia de -102 y variación de -99,03 %.
- Se preservaron JWT, propiedad por miembro, rate limiting, sincronización,
  pricing autoritativo y contratos anteriores.
- Validación: 51 suites y 299 pruebas backend; 19 suites y 71 pruebas mobile;
  build backend y type-check mobile aprobados.
- No se afirma mejora de latencia o bytes sin una comparación HTTP integrada en
  condiciones equivalentes.

### Bloque P3 de performance

- El runtime backend usa un artefacto portable con cierre productivo reducido;
  Prisma conserva algunos peers auxiliares.
- La imagen pasó de 817 MB a 724 MB: -93 MB y -11,38 %.
- El tamaño inspeccionado pasó de 174.383.125 a 152.567.797 bytes:
  -21.815.328 bytes y -12,51 %.
- Se preservaron Node fijado por digest, Prisma, bcrypt, OpenSSL, `dumb-init`,
  usuario no root, healthcheck, filesystem read-only y capabilities.
- Se corrigió la imagen de migración para incluir el helper requerido por
  `prisma.config.ts`.
- E2E posteriores: 3 suites y 9 pruebas aprobadas sobre PostgreSQL temporal.
- El build frío aumentó de 51,64 a aproximadamente 95 segundos; el tradeoff
  queda documentado y no se oculta.
- P4-P6 no introdujeron cambios sin evidencia suficiente.

### Skills formales de agente verificables

- `github:github`: utilizada para consultar los metadatos, la discusión y las
  aprobaciones del PR #8 y contrastar la revisión de la Entrega 3.

No existe evidencia persistida que permita afirmar que otras skills empaquetadas
de Codex se utilizaron en conversaciones históricas. Por trazabilidad, no se
atribuyen skills formales no verificables.

### Capacidades técnicas aplicadas durante el proyecto

Estas capacidades se desprenden de los cambios, tareas y validaciones:

- análisis de requisitos y TDD;
- arquitectura modular y hexagonal;
- NestJS, TypeScript, Prisma y PostgreSQL;
- React Native, Expo y testing de componentes;
- modelado de dominio y contratos HTTP;
- autenticación JWT y autorización por roles;
- seguridad de aplicaciones y revisión de dependencias;
- idempotencia, concurrencia y consistencia transaccional;
- integración con Mercado Pago y gateways fake;
- webhooks, HMAC, anti-replay y conciliación;
- Docker, Docker Compose y hardening de contenedores;
- GitHub Actions y estabilización de CI;
- UX accesible, responsive y orientada a prevención de errores;
- documentación técnica, bitácoras y gestión canónica de tareas.

---

## Convención para próximas entregas

Cada entrega nueva debe agregar una sección independiente con:

1. periodo, rama, PR y objetivo;
2. features por módulo;
3. contratos y decisiones de arquitectura;
4. bugs y correcciones;
5. observaciones recibidas en revisiones;
6. validación automática con cantidades reales;
7. validación manual ejecutada o diferida;
8. seguridad, infraestructura y documentación;
9. pendientes transferidos;
10. skills formales realmente utilizadas.
