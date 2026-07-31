# Conversaciones con IA — Entrega 3

formato: `Markdown`
proyecto: `Deskly-Mobile`
alcance: `Entregas 1, 2 y 3`
ultima_actualizacion: `2026-07-29`
idioma: `es-AR`

## Índice de temas

1. [Finalidad del archivo](#1-finalidad-del-archivo)
2. [Criterios generales acordados](#2-criterios-generales-acordados)
3. [Entrega 1 — Conversaciones del MVP](#3-entrega-1--conversaciones-del-mvp)
   - Prisma y PostgreSQL
   - Disponibilidad y CRUD de escritorios
   - Creación, cancelación y confirmación de reservas
   - TDDs, zonas, descripciones y amenities
   - Documentación de conversaciones
4. [Entrega 2 — Identidad y roles](#4-entrega-2--conversaciones-de-identidad-y-roles)
   - Autenticación, perfiles y miembros
   - Penalizaciones y operación del gestor
   - Administración de usuarios
   - Errores de login y cambio de contraseña
5. [Entrega 3 — Áreas y reservas](#5-entrega-3--conversaciones-de-áreas-y-reservas)
6. [Entrega 3 — Pagos](#6-entrega-3--conversaciones-de-pagos)
7. [Entrega 3 — Administración, seguridad e infraestructura](#7-entrega-3--administración-seguridad-e-infraestructura)
8. [Revisión final del PR #8](#8-revisión-final-del-pr-8)
9. [Ideas y trabajo futuro](#9-ideas-y-trabajo-futuro)
10. [Skills utilizadas](#10-skills-utilizadas)
11. [Regla de mantenimiento](#11-regla-de-mantenimiento)

## 1. Finalidad del archivo

Este archivo conserva una memoria técnica de las conversaciones y revisiones que
guiaron las entregas de Deskly. La extensión `.dm` se utiliza como
`Documento de Memoria` en el requerimiento original. Se normaliza como `.md`
porque el contenido, los encabezados, el índice y los enlaces utilizan Markdown;
`.cm` y `.dm` no representan un formato documental estándar en este proyecto.

No es una exportación literal de mensajes privados. Es una reconstrucción
trazable basada en archivos de conversación existentes, TDDs, tareas, commits,
documentación y revisiones de GitHub. Cuando un texto exacto está preservado se
marca como `prompt_registrado`. Cuando se infiere el pedido a partir del cambio
y su tarea se marca como `prompt_reconstruido`.

Cada registro usa:

- `tipo`: idea, requisito, bug, revisión, decisión, implementación,
  documentación o validación;
- `origen`: usuario, agente, tarea, prueba, GitHub o proveedor;
- `solicitud`: necesidad discutida;
- `respuesta`: solución o decisión aplicada;
- `resultado`: estado verificable;
- `pendiente`: trabajo no cerrado.

---

## 2. Criterios generales acordados

tipo: `decisión`
origen: `AGENTS.md y conversaciones`

solicitud:

- mantener coherencia completa entre frontend y backend;
- navegar al home tras un alta y al detalle tras una edición;
- mostrar mensajes de éxito y errores accionables;
- paginar homes de a 9 e historiales de a 3;
- enviar solamente diferencias reales en formularios de edición;
- consumir el historial cuando exista un endpoint;
- respetar roles, validación, auditoría y soft delete;
- documentar frontend y backend por módulo;
- aplicar test-first en dominio, persistencia, seguridad e integraciones;
- no ejecutar commits automáticamente;
- proponer Conventional Commits en español después de validar.

respuesta:

- se establecieron reglas de navegación, UX, contratos, seguridad,
  documentación y cierre;
- `/tasks` quedó definido como registro canónico;
- cada etapa debe conservar evidencia cuantitativa y pendientes reales.

resultado:

- estas reglas gobiernan la interpretación de las tres entregas;
- ninguna tarea en progreso se documenta como completada.

---

## 3. Entrega 1 — Conversaciones del MVP

### E1-01 — Conectar Prisma y PostgreSQL

tipo: `requisito + implementación`
origen: `conversación preservada`

prompt_reconstruido:

> Preparar la conexión del backend con Prisma y PostgreSQL sobre una estructura
> hexagonal, sin adelantar entidades fuera del alcance.

respuesta:

- configuración global de entorno;
- `PrismaService` y `DatabaseModule`;
- scripts de generación y migración;
- uso de `@prisma/client`;
- documentación de instalación y ejecución.

bugs:

- Prisma no encontraba la URL porque `.env.example` no es un entorno real;
- `import.meta.url` era incompatible con el build Nest configurado;
- credenciales PostgreSQL inválidas;
- base `deskly` inexistente;
- cliente generado incompatible con el runtime;
- `start:prod` buscaba `dist/main.js` en vez de `dist/src/main`.

resultado:

- conexión y migraciones operativas;
- build, lint y tests aprobados.

### E1-02 — Disponibilidad de escritorios

tipo: `feature`
origen: `TDD-0001`

prompt_reconstruido:

> Consultar escritorios disponibles por fecha y horario, excluyendo
> escritorios inactivos y reservas activas solapadas.

respuesta:

- entidad de escritorio;
- value objects de fecha y franja horaria;
- repositorio Prisma;
- caso de uso de disponibilidad;
- endpoint `GET /desks/availability`.

resultado:

- reservas canceladas no bloquean disponibilidad;
- rangos inválidos se rechazan;
- comportamiento cubierto por tests.

### E1-03 — CRUD de escritorios

tipo: `feature + decisión`

solicitud:

- crear, listar, ver, editar y eliminar escritorios;
- conservar trazabilidad.

respuesta:

- CRUD completo;
- paginación de 9;
- baja lógica con `deletedAt` y `enabled=false`.

resultado:

- un escritorio eliminado no aparece en listado, detalle ni disponibilidad.

### E1-04 — Crear y cancelar reservas

tipo: `feature`
origen: `TDD-0002 y TDD-0004`

prompt_registrado:

> En esta entrega no debo contemplar los usuarios. Así que implementa lo
> necesario sin tener en cuenta los usuarios o las relaciones con los mismos.

respuesta:

- se retiró `memberId` del contrato y del schema de esta entrega;
- se creó `POST /reservations`;
- se implementaron listado, detalle, edición, cancelación y baja lógica;
- se agregó una exclusión PostgreSQL contra solapamientos.

resultado:

- `404` para escritorio inexistente;
- `409` para conflicto de disponibilidad o recancelación;
- cancelación libera disponibilidad.

### E1-05 — Verificar los TDD restantes

tipo: `revisión`

prompts_registrados:

> Está cubierto por el CRUD implementado, verifica igualmente.

> En el TDD-0004-cancelación-reserva.md también está cubierto con lo actual.
> Verifícalo.

> Finalmente, comprueba el TDD-0005-confirmación-visual-reserva.md.

respuesta:

- TDD-0003 quedó parcialmente cubierto sin usuarios;
- TDD-0004 quedó cubierto para el alcance sin propiedad;
- TDD-0005 quedó cubierto en backend y pendiente como experiencia mobile;
- se agregó `deskName` y un error `409` estable.

pendiente:

- `/reservations/me`, autenticación y privacidad se transfirieron a Entrega 2.

### E1-06 — Ampliar el modelo de escritorios

tipo: `idea + feature`

prompt_registrado:

> Necesito que agregues al schema una descripción reutilizable, una zona
> enumerativa A, B o C y una clase asociada Amenities.

respuesta:

- `DeskZone`;
- `DeskDescription`;
- `Amenity`;
- `DeskAmenity`;
- actualización de DTOs, dominio, repositorios, casos de uso y controllers.

revisión_registrada:

> No crees la migración manual, borra los datos contenidos y genera la
> migración correctamente.

resultado:

- Prisma generó la migración después de sanear los datos incompatibles;
- se implementaron CRUDs completos para los nuevos catálogos.

### E1-07 — Documentar la conversación

tipo: `documentación`

prompt_registrado:

> Necesito que guardes la conversación en un .md dentro de docs y redactalo
> como si fuese obtenido desde un archivo de conversación con un Agente.

respuesta:

- se creó `docs/conversacion-agente-implementacion-mvp.md`;
- posteriormente se consolidó `CONVERSACIONES.md` en la raíz.

---

## 4. Entrega 2 — Conversaciones de identidad y roles

### E2-01 — Incorporar autenticación

tipo: `feature`

prompt_reconstruido:

> Agregar registro, login JWT, perfil y protección de endpoints sin romper el
> flujo existente de reservas.

respuesta:

- módulo de autenticación;
- guards JWT y roles;
- login y registro mobile;
- perfil y sesión;
- pruebas de login, guards y permisos.

### E2-02 — Asociar miembros y reservas

tipo: `feature + corrección`

solicitud:

- recuperar la relación omitida intencionalmente en Entrega 1;
- garantizar privacidad por usuario.

respuesta:

- reservas asociadas al miembro autenticado;
- miembros limitados a sus propios datos;
- gestores y administradores con permisos ampliados.

bug:

- algunas reservas no quedaban vinculadas correctamente al miembro.

resultado:

- contrato, persistencia y consultas corregidos.

### E2-03 — Penalizaciones y flujo del gestor

tipo: `feature`

solicitud:

- permitir check-in, ausencia, penalización y bloqueo operativo.

respuesta:

- check-in exclusivo de `GESTOR`;
- registro de ausencia;
- penalizaciones activas;
- bloqueo temporal por reglas de negocio;
- filtros por fecha para gestores.

### E2-04 — Administración de usuarios

tipo: `feature`

solicitud:

- administrar roles, accesos y bajas.

respuesta:

- listado administrativo;
- cambio de rol;
- baja lógica;
- reactivación y desbloqueo.

### E2-05 — Diferenciar errores de login

tipo: `revisión UX + bug`

solicitud:

- no agrupar todos los HTTP `401`;
- explicar si las credenciales son incorrectas, la cuenta está desactivada o
  existe un bloqueo temporal.

respuesta:

- `ACCOUNT_INACTIVE`;
- `blockedUntil`;
- `StatusModal` con títulos diferenciados;
- errores custom robustos frente a Babel.

### E2-06 — Cambio de contraseña

tipo: `feature + seguridad`

respuesta:

- validación de contraseña actual;
- reglas en tiempo real para la nueva contraseña;
- modal global;
- callback propagado a pantallas con `BottomTabBar`.

### E2-07 — Correcciones de integración

tipo: `bugs`

bugs:

- teléfonos largos rechazados;
- fechas de pago en formatos inconsistentes;
- navegación autenticada inestable después de integrar ramas;
- cuentas bloqueadas sin restauración administrativa.

resultado:

- contratos y UI estabilizados antes del cierre de Entrega 2.

---

## 5. Entrega 3 — Conversaciones de áreas y reservas

### E3-01 — Localidades y áreas de trabajo

tipo: `feature`

prompt_reconstruido:

> Modelar localidades y áreas de trabajo, asociar los escritorios, validar
> entidades activas y permitir filtrar disponibilidad sin consultas
> redundantes.

respuesta:

- entidades, servicios, endpoints y persistencia;
- filtros por localidad;
- DTOs de área;
- dirección y coordenadas vinculadas al área concreta;
- seed de datos de prueba;
- documentación de contratos.

revisión:

- se eliminó una referencia de ubicación redundante;
- se alineó la regla para que la localidad pertenezca al área y no a la reserva;
- los datos relacionados se exponen mediante el mapper de reserva.

### E3-02 — Pantalla de áreas

tipo: `feature + UX`

solicitud:

- navegar por localidad y área antes de elegir un escritorio;
- mantener compatibilidad con la navegación state-based.

respuesta:

- `LocalityFilter`;
- `LocalitySection`;
- `WorkAreaCard`;
- `WorkAreasScreen`;
- adaptación de `DesksScreen`;
- fixtures y pruebas de selección.

### E3-03 — Detalle de ubicación en Mis reservas

tipo: `tarea test-first`
origen: `MOBILE-RESERVATIONS-LOCATION`

solicitud:

- mostrar área, localidad y ubicación en cada reserva;
- evitar una llamada HTTP por tarjeta;
- mantener el detalle expandible, accesible e independiente.

respuesta:

- fixtures primero;
- pruebas del comportamiento actual;
- contrato `ReservationLocation` opcional;
- mapper backend y service mobile;
- `ReservationLocationDetails`;
- integración con `ReservationCard`;
- presentación de dirección, coordenadas y mapa.

bugs:

- coordenadas parciales o inválidas podían representarse;
- el mapa necesitaba declaraciones compatibles con TypeScript;
- una tarjeta no debía contaminar los datos de otra.

resultado:

- tarea completada con validación automática y manual registrada.

---

## 6. Entrega 3 — Conversaciones de pagos

### E3-04 — Definir un dominio de pagos seguro

tipo: `arquitectura + seguridad`

prompt_reconstruido:

> Reemplazar el pago CRUD por un flujo idempotente, con importe y moneda
> calculados en backend, gateway fake y confirmación de reserva solamente
> después de aprobación verificable.

respuesta:

- entidad `PaymentAttempt`;
- value object `Money`;
- política de precios;
- puertos de repositorio y gateway;
- snapshots monetarios;
- índices y restricciones de idempotencia.

decisiones:

- ARS es autoritativa;
- seña y total son opciones de backend;
- pago y reserva conservan estados separados;
- el gateway fake permanece para tests.

### E3-05 — Crear hold e iniciar checkout

tipo: `feature + concurrencia`
origen: `PAYMENTS-03`

solicitud:

- crear un hold `PENDING_PAYMENT`;
- impedir reservas duplicadas por doble toque o reintento;
- no confiar en importes del cliente.

respuesta:

- cotización autenticada;
- idempotency key;
- creación transaccional;
- disponibilidad protegida por base;
- consultas autorizadas por rol y propiedad.

resultado:

- etapa completada y documentada.

### E3-06 — Integrar Mercado Pago

tipo: `integración externa`
origen: `PAYMENTS-04`

solicitud:

- revisar el contrato vigente;
- comparar SDK y HTTP;
- no exponer secretos;
- conservar pruebas sin red.

respuesta:

- SDK oficial `mercadopago@3.2.0`;
- adaptador encapsulado;
- configuración condicional;
- timeout, idempotencia y errores sanitizados;
- allowlist HTTPS;
- fake gateway preservado.

incidencias:

- dominio sandbox ausente de la allowlist;
- reloj local desincronizado afectó la vigencia del checkout;
- confusión inicial entre preferencia y pago real.

resultado:

- preferencia sandbox creada;
- compra sandbox aprobada;
- correlación real corregida por referencia externa.

### E3-07 — Procesar webhooks

tipo: `seguridad + integración`
origen: `PAYMENTS-05`

solicitud:

- aceptar eventos sin JWT pero únicamente con firma válida;
- deduplicar replay;
- consultar al proveedor como fuente autoritativa;
- actualizar pago y reserva en una transacción.

respuesta:

- HMAC timing-safe;
- deduplicación por evento;
- matriz de transiciones;
- validación de referencia, ARS e importe;
- confirmación única de reserva;
- logs sin secretos.

resultado:

- webhooks repetidos y concurrentes no duplican efectos.

### E3-08 — Hardening y recuperación

tipo: `revisión de código + pruebas`
origen: `PAYMENTS-06`

solicitud:

- atacar el flujo con manipulación, concurrencia, timeout, reintentos y fallos
  parciales;
- reemplazar E2E inseguros por un flujo autenticado.

respuesta:

- pruebas de autorización y propiedad;
- diez solicitudes simultáneas;
- replay concurrente;
- aprobación y expiración simultáneas;
- rollback;
- conciliación de pagos envejecidos;
- observabilidad sanitizada;
- E2E con PostgreSQL y gateway fake.

evidencia:

- 17 suites y 129 pruebas focalizadas;
- 39 suites y 229 pruebas backend;
- 2 suites y 7 pruebas E2E;
- 17 migraciones desde cero;
- suite mobile y TypeScript aprobados.

### E3-09 — Integrar checkout en mobile

tipo: `feature + UX`
origen: `PAYMENTS-07`

solicitud:

- eliminar cálculo monetario autoritativo del cliente;
- abrir checkout de forma segura;
- no confirmar por la URL de retorno;
- mostrar pagos y saldo.

respuesta:

- service, hook y tipos dedicados;
- cotización backend;
- apertura exclusiva de HTTPS;
- polling acotado;
- reintento manual;
- pantalla paginada;
- saldo después de seña;
- estados de carga, error y terminales.

### E3-10 — Bug: reserva confirmada antes del pago

tipo: `bug crítico`

problema:

- el alta podía exponer la reserva como confirmada antes del checkout.

corrección:

- alta como `PENDING_PAYMENT`;
- hold de disponibilidad;
- transición a `RESERVED` solo por aprobación backend.

### E3-11 — Bug: pago pendiente sin webhook

tipo: `bug crítico`

problema:

- el polling consultaba el intento local;
- una preferencia no contiene el ID del pago real;
- sin webhook el intento permanecía `PENDING`.

corrección:

- búsqueda por referencia externa;
- `Payment.search`;
- validación de referencia, moneda e importe;
- sincronización en consultas autenticadas;
- persistencia mediante la misma transacción de confirmación.

### E3-12 — Retorno de Mercado Pago

tipo: `seguridad + UX`

decisión:

- el navegador no es una fuente confiable para aprobar pagos.

respuesta:

- páginas estáticas de retorno;
- ningún ID, estado o importe del navegador modifica dominio;
- el frontend espera el backend.

pendiente:

- repetir manualmente el flujo completo cuando el sandbox deje de producir un
  ciclo de redirecciones.

---

## 7. Entrega 3 — Administración, seguridad e infraestructura

### E3-13 — Panel administrativo

tipo: `feature`
origen: `ADMIN-01`

solicitud:

- administrar escritorios, tipos, amenities, localidades y áreas desde mobile;
- permitir altas y bajas relacionales en el mismo formulario;
- pedir confirmación antes de eliminar.

respuesta:

- pantalla y hook administrativos;
- formularios y mutaciones autenticadas;
- asociación de amenities;
- `StatusModal` para éxito y error;
- navegación por rol.

bug:

- una mutación autenticada perdía headers JSON al agregar Bearer.

resultado:

- ambos headers preservados y alta manual de localidad aprobada.

### E3-14 — Proteger reservas por propietario

tipo: `revisión de seguridad`

problema:

- detalle y edición conservaban permisos públicos heredados.

corrección:

- JWT obligatorio;
- validación de rol y propietario;
- pruebas de acceso cruzado.

### E3-15 — Endurecer autenticación

tipo: `seguridad`

respuesta:

- rate limiting de endpoints públicos;
- `tokenVersion` para invalidar sesiones;
- bootstrap administrativo mediante comando;
- bloqueo de escalada de privilegios por registro público.

bug_operativo:

- Expo Go alcanzó el backend pero recibió HTTP `500` porque la migración de
  `tokenVersion` no estaba aplicada.

resultado:

- migración aplicada;
- login confirmado desde dispositivo físico.

### E3-16 — Persistir sesión mobile

tipo: `feature + seguridad`

solicitud:

- restaurar sesión sin guardar secretos de forma insegura;
- limpiar sesiones inválidas.

respuesta:

- servicio de sesión;
- almacenamiento seguro native;
- ciclo de restauración validado contra `/auth/me`;
- limpieza defensiva;
- pruebas del ciclo de vida de `App`.

### E3-17 — Auditoría de dependencias

tipo: `revisión de seguridad`

problema:

- baseline backend con 33 vulnerabilidades productivas.

respuesta:

- actualizaciones compatibles de Nest, Prisma, TypeORM, Swagger y PostgreSQL;
- overrides transitivos acotados;
- limpieza de dependencias sin uso;
- auditoría equivalente mobile.

resultado:

- auditorías productivas en cero vulnerabilidades conocidas.

### E3-18 — Hallazgo GitGuardian

tipo: `revisión automática`
origen: `comentario del PR #8`

hallazgo:

- una contraseña genérica fue detectada en
  `.github/workflows/ci.yml`, commit `8cae3c7`.

respuesta:

- sustitución de credenciales hardcodeadas;
- secretos o credenciales temporales limitados por job;
- checkouts sin persistencia de credenciales;
- revisión de archivos de entorno y logs.

resultado:

- commit de remediación:
  `chore(ci): reemplazar credenciales por secretos de GitHub`.

### E3-19 — Hardening de CI y Docker

tipo: `infraestructura + seguridad`

solicitud:

- fijar la cadena de suministro;
- ejecutar validaciones completas en Linux;
- mantener contenedores no privilegiados.

respuesta:

- acciones por SHA;
- imágenes por digest;
- usuarios `deskly`, `migration` y `expo`;
- PostgreSQL efímero;
- jobs separados;
- healthchecks;
- filesystem de solo lectura y capacidades reducidas.

bugs:

- Corepack seleccionó una versión de pnpm incompatible;
- Jest y algunos patrones de cobertura fallaban en Linux;
- validaciones CI necesitaron tres rondas de estabilización.

estado:

- evidencia local completa;
- `INFRA-02` sigue `EN_PROGRESO` por validación remota pendiente registrada.

### E3-20 — Conectividad Expo

tipo: `infraestructura + bug`
origen: `INFRA-01`

solicitud:

- utilizar web, emulador y dispositivo físico sin cambiar código ni introducir
  fallbacks inseguros.

respuesta:

- perfiles de entorno;
- URL única y explícita;
- LAN para Expo Go;
- HTTPS obligatorio en producción;
- `/health`;
- binding backend a todas las interfaces.

decisión:

- no incorporar API gateway mientras exista un único backend modular.

resultado:

- loopback y LAN respondieron HTTP `200`;
- login real desde Expo Go confirmado.

### E3-21 — Rate limiting de pagos

tipo: `seguridad + performance`

respuesta:

- límites independientes para checkout, lectura y webhook;
- HTTP `429` verificado;
- documentación de la limitación del store en memoria.

pendiente:

- store distribuido antes de escalar horizontalmente.

---

## 8. Revisión final del PR #8

tipo: `revisión GitHub`

metadatos:

- título: `feat: Consolidar aplicación con mejoras acordes a la entrega 3`;
- base: `main`;
- head: `dev`;
- commits: `92`;
- archivos: `364`;
- adiciones: `33297`;
- eliminaciones: `2004`;
- creado: `2026-07-27`;
- fusionado: `2026-07-28`.

aprobaciones:

- `WilliamsIgnacio`: `APPROVED`;
- `avilugo110`: `APPROVED`.

comentarios_inline:

- no se encontraron observaciones humanas inline públicas;
- sí se registró y remedió el hallazgo automático de GitGuardian.

validación_declarada:

- backend: 47 suites, 287 pruebas;
- E2E PostgreSQL: 3 suites, 9 pruebas;
- mobile: 19 suites, 69 pruebas;
- TypeScript, build, Expo web, ESLint, Prettier y `git diff --check`
  aprobados;
- auditorías productivas sin vulnerabilidades conocidas.

---

## 9. Ideas y trabajo futuro

tipo: `backlog`

- cerrar la validación manual integral de Mercado Pago sandbox;
- confirmar retorno, aparición en Pagos y pago de saldo;
- cerrar formalmente `PAYMENTS-07`;
- validar CI en remoto y cerrar `INFRA-02`;
- seleccionar proveedor e implementar `ADMIN-02` para geocodificación;
- extender auditoría e historial de cambios a entidades restantes;
- migrar rate limiting a almacenamiento distribuido;
- completar TLS, proxy reverso, monitoreo y cloud;
- evaluar API gateway solamente cuando existan múltiples servicios o
  necesidades de enrutamiento reales;
- conservar fake gateway y fixtures para pruebas deterministas.

---

## 10. Skills utilizadas

### Skills formales verificadas

skill:

- nombre: `github:github`
- uso: consulta de metadatos, comentarios y aprobaciones del PR #8;
- evidencia: reconstrucción de la revisión y del hallazgo GitGuardian.

nota:

- las conversaciones históricas no registraron de forma persistente el nombre
  de otras skills empaquetadas;
- no se inventan atribuciones retroactivas.

### Capacidades aplicadas

- análisis de TDD y requisitos;
- arquitectura hexagonal y modular;
- NestJS, Prisma y PostgreSQL;
- React Native y Expo;
- testing unitario, de componentes, contractual y E2E;
- autenticación, autorización y seguridad;
- pagos, idempotencia, concurrencia y transacciones;
- integración Mercado Pago;
- webhooks, HMAC, replay y conciliación;
- Docker, Compose, CI/CD y supply-chain hardening;
- accesibilidad y UX;
- documentación y trazabilidad de tareas.

---

## 11. Regla de mantenimiento

Al terminar una conversación relevante:

1. agregar un registro con ID de entrega;
2. indicar si el prompt es literal o reconstruido;
3. separar solicitud, decisión, implementación, bug y validación;
4. vincular la tarea canónica y el commit cuando existan;
5. registrar cantidades reales de pruebas;
6. conservar pendientes y bloqueos externos;
7. listar solamente skills cuyo uso pueda verificarse;
8. no almacenar secretos, tokens, contraseñas ni datos personales.

---

## 12. Auditoría de performance posterior a seguridad

tipo: `auditoría + línea base + propuesta`
fecha: `2026-07-29`
estado: `DIAGNOSTICO_COMPLETADO_PENDIENTE_DE_APROBACION`

### Solicitud

El usuario solicitó actuar como ingeniero senior de performance y coordinador,
separar responsabilidades, comprender flujos críticos, medir antes de cambiar,
preservar seguridad y detenerse en un punto de aprobación obligatorio.

También indicó que, una vez autorizado un bloque, debe:

- resolverse un hallazgo por vez;
- repetirse exactamente la medición;
- ejecutarse regresión funcional y de seguridad;
- crearse un commit independiente antes de continuar.

### Coordinación

Se separaron los informes de:

- `repository-analyst`;
- `performance-profiler`;
- `backend-database-specialist`;
- `frontend-mobile-specialist`.

El implementador, validador y revisor final quedan reservados para después de
aprobar un bloque.

### Entorno

- commit `9568dbe`;
- Windows 11;
- Intel i5-1235U;
- 16 GB RAM;
- Node 22.17.0;
- pnpm 10.33.2;
- Docker 29.4.0;
- PostgreSQL 17 temporal;
- gateway de pagos fake.

### Dataset

- 18 migraciones desde cero;
- 1.000 escritorios;
- 1.000 miembros;
- 4.000 reservas;
- datos completamente sintéticos;
- sin acceso a producción.

### Bugs e incidencias durante la medición

1. El primer contenedor excedió el timeout del shell, aunque terminó iniciando.
2. Dos cargas SQL fallaron por el nombre de enums; las transacciones se
   revirtieron y la carga válida se verificó por conteos.
3. Una medición autenticada se ejecutó sin token por permisos Docker y produjo
   100 % de errores. Fue descartada y repetida correctamente con 0 %.
4. El primer build no recibió `DATABASE_URL`; se descartó y repitió contra la
   base temporal.
5. No existe herramienta de benchmark, APM, perfilador mobile ni métricas de
   consultas configuradas; se usaron herramientas ya disponibles.

### Hallazgo confirmado: disponibilidad de áreas

Con 1.000 escritorios y 4.000 reservas:

- p95 ocupado c1: 60,90-69,75 ms;
- p95 ocupado c10: 474,12-752,42 ms;
- p95 disponible c1: 53,60-84,67 ms;
- p95 disponible c10: 471,02-778,87 ms;
- respuesta: 12 bytes;
- consulta representativa: 4.000 filas y 9,001 ms;
- consulta agregada experimental: 100 grupos y 1,998 ms.

Causa:

- el flujo reutiliza la disponibilidad completa de escritorios;
- carga relaciones y reservas;
- crea entidades;
- calcula solapamientos y agrupa en JavaScript.

Propuesta:

- repositorio dedicado con agregación PostgreSQL;
- mismo endpoint, filtros, seguridad y contrato;
- sin caché ni índice nuevo.

### Hipótesis cuantificada: amplificación en Pagos

La pantalla ejecuta:

`3 + páginas adicionales + (2 * reservas únicas)`

Con 50 reservas y una página por estado son 103 requests según el flujo
estático. No se afirmó impacto de performance: requiere una medición de pantalla
y autorización de contrato antes de implementar un endpoint batch.

### Hipótesis no promovidas a optimización

- actualización global de reservas vencidas;
- fan-out de sincronización de pagos;
- búsqueda de usuarios con `%texto%`;
- filtros de conciliación e índices;
- tabs ocultas montadas;
- listas con `ScrollView`;
- requests no cancelados;
- bundle web monolítico.

No se modificaron porque falta evidencia suficiente o porque el cambio podría
alterar consistencia, UX o seguridad.

### Validación del diagnóstico

- disponibilidad y listados: p50, p95, p99, throughput, payload y errores;
- PostgreSQL: `EXPLAIN ANALYZE`, buffers, cardinalidad y tamaño;
- mobile: 19 suites y 69 pruebas aprobadas;
- TypeScript mobile aprobado;
- export web medido tres veces;
- backend build medido tres veces;
- inicio backend medido tres veces;
- no se modificó código productivo.

La medición crítica de áreas se repitió tres veces con c1 y c10. También se
agregó un escenario disponible que devuelve 100 áreas y 35.113 bytes. La
dispersión observada quedó registrada como barrera para la comparación posterior.

### Próximo paso

Esperar aprobación explícita del bloque P1. Si se aprueba:

1. aplicar solo la consulta agregada;
2. ejecutar tests;
3. repetir el benchmark idéntico;
4. solicitar validación independiente;
5. revertir si la mejora queda dentro del ruido;
6. documentar resultados;
7. crear un commit aislado.

### Implementación y validación del bloque P1

El usuario aprobó explícitamente P1. Se reemplazó la materialización completa de
escritorios y reservas por una consulta agregada parametrizada en PostgreSQL.

Se preservaron:

- filtros por zona, área y localidad;
- escritorios habilitados y no eliminados;
- áreas y localidades activas;
- estados bloqueantes;
- límites horarios half-open;
- orden, DTO y contrato HTTP;
- autenticación, autorización, rate limiting y auditoría.

La comparación estricta utilizó el mismo fixture y proceso para el código
anterior y posterior. Resultado:

- 1.560 requests, 0 errores;
- reducción de p95 entre 86,88 % y 94,93 %;
- throughput entre 609,56 % y 1.865,46 % superior;
- payloads idénticos por bytes y SHA-256;
- 48 suites y 291 pruebas backend aprobadas;
- 3 suites y 9 E2E aprobadas en base limpia;
- build aprobado;
- revisión independiente aprobada.

Incidencia:

- una corrida E2E sobre el fixture poblado falló porque `auth-bootstrap` exige
  una base sin usuarios;
- se clasificó como precondición del test y se repitió en otra base temporal
  migrada desde cero, donde aprobaron las 9 pruebas.

El dato exploratorio de 35.113 bytes no correspondía exactamente al fixture
versionado. Se corrigió mediante una comparación estricta: 38.605 bytes tanto
antes como después, sin regresión contractual.

### Implementación y validación del bloque P2

El usuario aprobó anticipadamente los bloques restantes y autorizó commits
locales sin push. Se midió la orquestación de Pagos antes de editar:

- 9 reservas: 21 requests y pico 9;
- 50 reservas: 103 requests y pico 50;
- 150 reservas: 303 requests y pico 150.

El primer borrador backend paginaba antes de sincronizar y podía incluir
reservas sin pagos aprobados. La revisión detectó la regresión antes del cierre.
Se corrigió a la secuencia equivalente: candidatos propios, sincronización,
filtro por algún intento `APPROVED` y paginación máxima de 9.

Se agregó `GET /payments/summary`. El `memberId` proviene del JWT; se conservaron
rate limiting, pricing ARS autoritativo, errores seguros, endpoints existentes
y sincronización. Mobile reemplazó el fan-out por una solicitud por página y
formatea la fecha ISO al `dateLabel` existente.

Bugs e incidencias:

1. `node_modules` backend estaba incompleto y faltaban `jest`, `nest`, `tsc`,
   `picomatch` y `chokidar`. Se restauró exactamente el lockfile con
   `pnpm install --frozen-lockfile --force`, sin cambiar dependencias.
2. El test del DTO no cargaba `reflect-metadata`; se corrigió la inicialización.
3. TypeScript exigió un `import type` para el puerto inyectado; se corrigió sin
   alterar comportamiento.

Validación:

- focal P2 backend: 4 suites y 16 pruebas;
- Payments backend: 22 suites y 156 pruebas;
- backend completo: 51 suites y 299 pruebas;
- mobile focal: 3 suites y 9 pruebas;
- mobile completo: 19 suites y 71 pruebas;
- build backend y type-check mobile aprobados;
- `git diff --check` aprobado.

Resultado medido para 50 reservas: 103 requests antes y 1 después, diferencia
de -102 y -99,03 %. No se afirmó una mejora de latencia HTTP, bytes, CPU o
memoria porque no existió una comparación integrada equivalente.

### Implementación y validación del bloque P3

Se reconstruyó la imagen del commit actual para no comparar contra una imagen
histórica. La línea base fue 817 MB virtuales y 174.383.125 bytes según
`docker inspect`; la capa `node_modules` representaba 466 MB.

El runtime pasó a copiar un artefacto portable generado con
`pnpm deploy --prod`. El candidato final midió 724 MB y 152.567.797 bytes:
-93 MB virtuales (-11,38 %) y -21.815.328 bytes inspeccionados (-12,51 %).

Bugs e ideas descartadas durante P3:

1. El primer artefacto reducido omitía `.prisma/client/default`; falló la carga
   real dentro del contenedor y fue rechazado. Se copió el cliente generado al
   árbol productivo y se repitió la prueba.
2. La imagen `migration` no incluía `src/config/env-files.ts`, requerido por
   `prisma.config.ts`. Compose falló antes de iniciar backend; se agregó solo ese
   helper y la migración completó.
3. Se evaluó `pnpm --offline deploy`, pero falló porque el store BuildKit no
   contenía el tarball de bcrypt. La variante se descartó.
4. El build frío aumentó de 51,64 a aproximadamente 95 segundos. La regresión
   se conserva documentada; los builds calientes quedaron en rangos similares.

Se comprobaron Prisma, bcrypt, Nest, migración, healthcheck, UID 10001,
filesystem read-only, `cap-drop ALL` y `no-new-privileges`. Las muestras de
memoria se solaparon y no se afirmó una mejora. Los E2E posteriores aprobaron
3 suites y 9 pruebas sobre PostgreSQL temporal migrado. Se documentó que
`pnpm deploy --prod` reduce el cierre, pero Prisma conserva peers auxiliares.

P4 no se implementó porque agregaría observabilidad sin una mejora directa ni
backend de métricas. P5 continúa como hipótesis de cancelación de red que
requiere medición. P6 se descartó para listados de 9 y se conserva como
hipótesis para hasta 100 reservas de gestor. Tampoco se agregaron caché,
índices, memoización o virtualización por intuición.

### Revisión final de configuración y onboarding

Se solicitó revisar los archivos de entorno versionables y convertir el README
raíz en una guía declarativa para quien evalúe el proyecto.

Se contrastaron las plantillas con:

- validación central de entorno backend;
- resolución de archivos según `NODE_ENV`;
- configuración Prisma;
- bootstrap administrativo;
- configuración y límites de Mercado Pago;
- resolución y validación de la URL pública Expo;
- variables exigidas por Docker Compose.

Se ampliaron las siete plantillas versionables con propósito, obligatoriedad,
formatos, límites, ejemplos seguros y advertencias. No se versionaron secretos.
El placeholder JWT de desarrollo comienza con `change_me` para que la validación
lo rechace hasta que el revisor lo reemplace.

El README documenta requisitos, Corepack/pnpm, copia inicial en PowerShell y
Bash, PostgreSQL, migraciones, seed, bootstrap, backend, mobile, Docker Compose,
healthcheck, logs, detención, eliminación opcional de volúmenes y validaciones.
También se actualizaron las cantidades de pruebas y se agregó el crédito exacto
solicitado por el usuario.

### Corrección del job de calidad backend

GitHub Actions informó tres archivos fuera del formato Prettier. El resto de los
jobs había finalizado correctamente. Se ejecutó `prettier --write` únicamente
sobre esos archivos y luego el mismo `prettier --check` del pipeline sobre
`src/**/*.ts` y `test/**/*.ts`.

Resultado:

- todos los archivos backend cumplen Prettier;
- 3 suites y 10 pruebas focalizadas aprobadas;
- `git diff --check` aprobado;
- los cambios son exclusivamente mecánicos y no alteran comportamiento.

El siguiente intento del job de calidad informó un único error ESLint:
`WorkAreaProperties` estaba importado pero no se utilizaba en
`prisma-desk.repository.ts`. Se eliminó exclusivamente ese type import. ESLint
con cero warnings, Prettier, 4 pruebas focalizadas y `git diff --check`
aprobaron antes de publicar la rama.

---

## 13. Cierre posterior al PR #9: CI mobile y refresh token

### E3-22 — Debug del pipeline mobile

solicitud:

> El pipeline de CI tuvo fallos al integrar el PR a main. Los problemas son en
> mobile, en la validación de TypeScript y en los tests mobile. Corroborarlo.

resultado:

- el run `30568825131` confirmó fallos únicamente en `Mobile calidad` y
  `Mobile tests`;
- backend unitario, backend build, calidad backend, E2E PostgreSQL, Docker y
  Expo export aprobaron;
- TypeScript reprodujo cuatro errores de tipos y estilos;
- Jest reprodujo 18 de 19 suites y 69 de 71 pruebas aprobadas;
- se corrigieron narrowing, normalización de zona, estilos y fixtures;
- TypeScript y las 19 suites con 71 pruebas aprobaron.

commit_ejecutado:

`e6be044 fix(mobile): corregir validaciones del pipeline`

Detalle temático:

`ia/entrega-3/debug-pipeline-mobile.md`

### E3-23 — Refresh token y renovación transparente

solicitud:

> Revisar la deuda técnica de refresh token, implementarla después de corregir
> CI y evaluar luego la complejidad del prop drilling.

resultado_backend:

- `POST /auth/refresh`;
- secretos y expiraciones independientes;
- validación de firma, tipo, versión, usuario, miembro y bloqueo;
- reemisión de access y refresh token;
- rate limiting y mensajes seguros.

resultado_mobile:

- access y refresh token en SecureStore para native;
- sesión web únicamente en memoria;
- renovación al restaurar;
- un refresh concurrente;
- reintento único tras `401`;
- cierre local ante renovación rechazada;
- wrapper compartido adoptado por services autenticados.

validacion:

- backend: 52 suites y 307 pruebas;
- mobile: 20 suites y 73 pruebas;
- E2E: 3 suites y 10 pruebas sobre PostgreSQL limpio con 18 migraciones;
- build backend, TypeScript, Expo web, Prettier, ESLint y
  `git diff --check`: aprobados.

deuda_tecnica:

- `AuthContext`: pendiente, complejidad media;
- refresh token: completado;
- pull-to-refresh nativo: pendiente;
- cobertura de guards: mayormente completada, con lecturas públicas sujetas a
  decisión contractual;
- replay persistente y sesiones por dispositivo: fuera del alcance actual.

commit_ejecutado:

`fbc7e5c feat(auth): incorporar renovacion segura de sesion`

Detalle temático:

`ia/entrega-3/refresh-token-deuda-tecnica.md`

---

## 14. Cierre de deuda tecnica: navegacion ADMIN y AuthContext

### E3-24 — Navegacion desde Mi perfil

solicitud:

> Desde una cuenta ADMIN, Mi perfil no permite recorrer las demas pantallas de
> la Bottom Tab Bar. Verificarlo, corregirlo y ejecutar el commit.

resultado:

- se confirmo que Panel era visible pero no recibia callback;
- `ProfileScreen` ahora propaga `onPressAdminCatalog`;
- se agrego la regresion Panel → Mi perfil → Panel;
- TypeScript, 20 suites con 74 pruebas y export Expo aprobaron.

commit_ejecutado:

`824bbaf fix(mobile): restaurar navegacion admin desde perfil`

### E3-25 — Eliminacion de prop drilling sin cambios funcionales

solicitud:

> Solucionar el prop drilling con un enfoque multiagente para validar, testear,
> desarrollar y orquestar el flujo. No modificar el comportamiento actual.

resultado:

- se coordinaron auditorias de arquitectura, pruebas y revision final;
- `AuthProvider` y `useAuth` centralizan sesion, token, usuario y rol;
- `App.tsx` conserva navegacion, persistencia y ciclo de sesion;
- las pantallas y la barra dejaron de propagar datos de autenticacion por props;
- refresh, logout, cambio de cuenta, cambio de contraseña, permisos y tabs
  mantienen sus contratos;
- la actualizacion de sesion por runtime conserva la pantalla activa.

validacion:

- TypeScript aprobado;
- 21 suites y 77 pruebas con cobertura aprobadas;
- suite final: 21 suites y 78 pruebas aprobadas;
- `AuthContext` con 100 % de cobertura;
- export Expo web y build Docker mobile aprobados;
- servicios Docker con healthchecks aprobados;
- revision independiente sin regresiones bloqueantes;
- prueba manual pendiente a cargo del usuario.

Detalle tematico:

`ia/entrega-3/auth-context-prop-drilling.md`

---

### E3-26 — Pull-to-refresh nativo y actualización de deuda técnica

solicitud:

> Implementar pull-to-refresh, corregir la referencia inconsistente, mantener
> el registro, probar, levantar el proyecto y ejecutar el commit.

resultado:

- se incorporó `RefreshControl` en áreas, escritorios, reservas, pagos y perfil;
- el hook compartido evita recargas manuales simultáneas;
- se conservaron los `refreshKey` usados para sincronización entre pantallas;
- se protegieron las cargas contra respuestas obsoletas;
- se actualizó la deuda de `AuthContext` y pull-to-refresh a completada;
- no se modificaron contratos HTTP, permisos, filtros ni navegación.

validación:

- TypeScript aprobado;
- 5 suites focales y 23 pruebas aprobadas;
- suite completa: 22 suites y 84 pruebas aprobadas;
- export Expo web y build Docker mobile aprobados;
- database, backend y mobile con healthchecks aprobados;
- backend `/health` respondió 200;
- Metro reportó `packager-status:running`;
- `git diff --check` aprobado;
- entorno levantado para la prueba visual del usuario.

commit_autorizado:

`feat(mobile): incorporar pull-to-refresh nativo`

Detalle temático:

`ia/entrega-3/pull-to-refresh.md`

---

### E3-27 — Autenticacion obligatoria de endpoints funcionales

solicitud:

> Los endpoints deben requerir autenticacion porque el flujo de la pagina es
> autenticado. Implementar para que no sean accesibles sin sesion.

decision:

- todas las rutas de Desks, catalogo, localidades, areas y disponibilidad
  requieren `JwtAuthGuard`;
- las mutaciones conservan `RolesGuard` para `ADMIN` y `GESTOR`;
- Payments funcional ya estaba protegido;
- `/webhooks/payments` y `/payments/return` permanecen publicos por ser entradas
  del proveedor y no formar parte de la navegacion autenticada;
- `Desk-Settings` se corrige como referencia historica: no es un modulo backend
  independiente.

implementacion:

- guard JWT y Bearer Auth de Swagger a nivel de los cinco controladores Desks;
- service mobile alineado para autenticar tambien todas las lecturas mediante
  la sesion centralizada y conservar refresh automatico;
- pruebas de metadata y HTTP para impedir acceso anonimo.

validacion:

- prueba focal backend: 1 suite y 20 pruebas aprobadas;
- backend completo: 52 suites y 312 pruebas aprobadas;
- E2E HTTP focal: 1 suite y 8 pruebas aprobadas;
- E2E PostgreSQL limpio: 18 migraciones, 3 suites y 17 pruebas aprobadas;
- pruebas mobile focales: 2 suites y 4 pruebas aprobadas;
- mobile completo: 22 suites y 85 pruebas aprobadas;
- build backend, TypeScript y export Expo web aprobados;
- Prettier y ESLint focales aprobados;
- build Docker backend y mobile aprobado;
- database, backend y mobile con healthchecks aprobados;
- ocho rutas funcionales verificadas manualmente respondieron `401` sin JWT;
- `/health` respondio 200 y Metro `packager-status:running`;
- la deuda tecnica declarada al cierre de E2 queda completada.

mensaje_de_commit_propuesto:

`fix(seguridad): exigir autenticacion en consultas de escritorios`

---

### E3-28 — Confirmacion resiliente de pagos sandbox

solicitud:

> Ejecutar el plan para diagnosticar la falta de confirmacion sandbox. Diferir
> la simulacion manual y el cierre visual consecuente.

diagnostico:

- la preferencia no enviaba `notification_url`;
- un pago sin `payment_id` podia expirar sin buscarse por
  `external_reference`;
- la conciliacion existia como caso de uso, pero no tenia ejecucion periodica;
- mobile ya esperaba el estado autoritativo del backend y no confirmaba por el
  retorno visual.

implementacion:

- validacion estricta de URL HTTPS, origen permitido, ruta y query del webhook;
- `notification_url` incorporada a cada preferencia de Checkout Pro;
- busqueda autoritativa por referencia antes de expirar pagos pendientes;
- worker de conciliacion configurable, con lotes acotados y bloqueo de
  solapamiento;
- variables de entorno de ejemplo y documentacion operativa actualizadas;
- comportamiento mobile preservado.

validacion:

- configuracion y gateway: 2 suites y 37 pruebas aprobadas;
- conciliacion y worker: 2 suites y 11 pruebas aprobadas;
- Payments backend: 23 suites y 165 pruebas aprobadas;
- backend completo: 53 suites y 321 pruebas aprobadas;
- E2E PostgreSQL: 3 suites y 17 pruebas aprobadas;
- mobile completo: 22 suites y 85 pruebas aprobadas;
- build backend, TypeScript, Expo web, Docker, lint, formato y
  `git diff --check`: aprobados;
- database, backend y mobile saludables; `/health` 200 y Metro activo.

pendiente_manual:

- ejecutar el pago con cuentas y credenciales de prueba;
- emitir la notificacion mediante el simulador oficial usando el identificador
  real;
- verificar pago `APPROVED`, reserva confirmada y actualizacion visual;
- cerrar `PAYMENTS-08` y el cierre manual dependiente de `PAYMENTS-07`.

mensajes_de_commit_propuestos:

- `feat(pagos): configurar notificaciones por preferencia`
- `feat(pagos): automatizar conciliacion de pagos pendientes`
- `docs(pagos): registrar validacion sandbox pendiente`

---

### E3-29 — Validacion real del webhook de Mercado Pago

resultado:

- se corrigio la firma para usar `data.id` de query segun el contrato oficial;
- el simulador entrego un POST con firma y request ID validos;
- ngrok respondio HTTP 200;
- Deskly correlaciono el pago `170515659197` y conservo `APPROVED`;
- conciliacion y webhook convergieron sin duplicar la transicion;
- `PAYMENTS-08` se marco `COMPLETADA`;
- `PAYMENTS-07` conserva pendientes sus comprobaciones visuales especificas.

validacion_automatizada:

- focal: 2 suites y 34 pruebas aprobadas;
- Payments: 23 suites y 167 pruebas aprobadas;
- backend completo: 53 suites y 323 pruebas aprobadas;
- build backend y `git diff --check` aprobados.

mensaje_de_commit_propuesto:

`fix(pagos): adaptar webhooks al contrato firmado de Mercado Pago`

---

### E3-30 — Modal de saldo y filtros de pagos

resultado:

- `Completar pago` muestra la cotizacion en un modal sin alterar el checkout;
- se agregaron filtros `Todos`, `Pendientes` y `Completados`;
- backend aplica el filtro antes de paginar y mobile vuelve a pagina 1;
- los estados vacios explican el filtro seleccionado;
- se conservaron importes, idempotencia, polling y navegacion.

validacion:

- focal modal: 1 suite y 5 pruebas;
- focal filtros backend: 3 suites y 9 pruebas;
- focal filtros mobile: 3 suites y 12 pruebas;
- backend completo: 53 suites y 325 pruebas;
- mobile completo: 22 suites y 87 pruebas;
- build backend, TypeScript, formato y `git diff --check`: aprobados.

mensajes_de_commit_propuestos:

- `feat(pagos): mostrar opciones de saldo pendiente en modal`
- `feat(pagos): filtrar pagos pendientes y completados`

---

### E3-31 — Requisitos dinámicos de contraseña

resultado:

- el registro muestra longitud, mayúscula y número mientras sigan pendientes;
- cada requisito desaparece inmediatamente al cumplirse;
- frontend y backend validan el mismo contrato de contraseña;
- login, sesiones, tokens y navegación conservaron su comportamiento.

validación:

- focal backend: 1 suite y 5 pruebas;
- focal mobile: 2 suites y 5 pruebas;
- backend completo: 53 suites y 328 pruebas;
- mobile completo: 24 suites y 92 pruebas;
- build backend y TypeScript mobile: aprobados.

mensaje_de_commit_propuesto:

`feat(auth): mostrar requisitos dinamicos de contraseña`

ajuste_posterior:

- la guía progresiva también se muestra en el formulario de login;
- funciona solo como ayuda visual y no exige mayúscula ni número a credenciales existentes;
- mobile completo: 24 suites y 93 pruebas, más TypeScript aprobado.
