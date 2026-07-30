# Auditoria de performance y optimizacion incremental

| Campo          | Valor |
| -------------- | ----- |
| ID             | `PERFORMANCE-01` |
| Modulo         | Backend, PostgreSQL, mobile e infraestructura |
| Estado         | `COMPLETADA` |
| Dependencia    | Auditorias `SECURITY-01` a `SECURITY-08` completadas; aprobacion explicita por bloque |
| Implementacion | Primer candidato: `backend/src/modules/desks`; candidatos posteriores en Payments mobile/backend y Docker |
| Validacion     | Benchmark antes/despues bajo el mismo dataset, tests focalizados, suite relevante, build, TypeScript, E2E, controles de seguridad y `git diff --check` |

## Objetivo

Construir una linea base reproducible posterior a la auditoria de seguridad,
identificar cuellos de botella mediante mediciones y ejecutar, solamente con
aprobacion explicita, una optimizacion independiente por vez.

## Contexto inspeccionado

- Backend NestJS 11, Prisma 7 con adaptador PostgreSQL y Node 22.
- Mobile Expo 54, React Native 0.81 y React 19.
- PostgreSQL 17.
- Mercado Pago Checkout Pro y gateway fake determinista.
- Docker multi-stage, Docker Compose y GitHub Actions.
- Paginacion de 9 en homes y limites backend de hasta 50.
- Logging HTTP con correlacion, status y duracion.
- Sin APM, histogramas, metricas de pool, profiling mobile o benchmark
  versionado.
- Auditorias de dependencias, autenticacion, CI, Docker y rate limiting
  completadas antes de esta tarea.

## Reglas de seguridad heredadas

Ningun bloque puede:

- retirar autenticacion, autorizacion o validaciones;
- reducir rate limiting, auditoria u observabilidad;
- confiar en datos del cliente;
- alterar idempotencia, locks, transacciones o constraints;
- usar Mercado Pago real como benchmark;
- usar datos productivos;
- modificar contratos publicos sin autorizacion especifica.

## Linea base

La evidencia completa se encuentra en
`docs/performance/performance-baseline.md`.

Resumen:

| Escenario | p50 | p95 | p99 | Throughput | Errores | Payload |
| --------- | ---: | ---: | ---: | ---------: | ------: | ------: |
| Disponibilidad escritorios, c1 | 82,72 ms | 114,19 ms | 122,12 ms | 11,42 req/s | 0 % | 713.924 B |
| Disponibilidad escritorios, c10 | 751,12 ms | 863,56 ms | 926,22 ms | 13,34 req/s | 0 % | 713.924 B |
| Areas ocupadas, c1 | 46,16-59,21 ms | 60,90-69,75 ms | 70,07-90,37 ms | 16,45-20,46 req/s | 0 % | 12 B |
| Areas ocupadas, c10 | 425,80-652,71 ms | 474,12-752,42 ms | 528,40-774,96 ms | 15,49-23,11 req/s | 0 % | 12 B |
| Areas disponibles, c1 | 49,15-64,12 ms | 53,60-84,67 ms | 54,25-89,70 ms | 14,74-20,44 req/s | 0 % | 35.113 B |
| Areas disponibles, c10 | 423,06-656,89 ms | 471,02-778,87 ms | 493,09-806,29 ms | 15,01-23,19 req/s | 0 % | 35.113 B |
| Escritorios paginados 9, c1 | 19,33 ms | 24,17 ms | 28,28 ms | 50,33 req/s | 0 % | 5.512 B |
| Reservas gestor 50, c1 | 33,62 ms | 41,21 ms | 41,89 ms | 28,82 req/s | 0 % | 29.416 B |
| Reservas gestor 50, c10 | 119,77 ms | 174,50 ms | 181,81 ms | 77,25 req/s | 0 % | 29.416 B |

## Cuellos confirmados

### PERF-BE-01: disponibilidad de areas materializa escritorios completos

`findAvailableWorkAreasByTimeSlot` reutiliza la consulta de disponibilidad de
escritorios. Carga relaciones completas y reservas del dia para 1.000
escritorios, convierte entidades y calcula solapamientos en JavaScript antes de
agrupar 100 areas.

Evidencia:

- p95 HTTP ocupado: 60,90-69,75 ms con c1 y 474,12-752,42 ms con c10.
- p95 HTTP disponible: 53,60-84,67 ms con c1 y 471,02-778,87 ms con c10.
- respuesta final: 12 bytes en el escenario sin areas disponibles.
- consulta representativa actual: 4.000 filas, 9,001 ms.
- consulta agregada experimental: 100 grupos, 1,998 ms; equivalencia aun no
  demostrada.
- mismo PostgreSQL, dataset y proceso; no se agregaron indices.

### PERF-MOB-01: amplificacion de requests en Pagos pendiente de impacto

El hook descarga todas las paginas de tres estados y luego ejecuta dos requests
por cada reserva antes de paginar localmente.

Formula:

`3 + paginas adicionales + (2 * reservas unicas)`

Con 50 reservas y una pagina por estado son 103 requests para una carga. La
cantidad esta confirmada por el flujo estatico; no se clasifica como cuello de
performance hasta medir latencia, bytes y recursos de pantalla.

## Hipotesis que requieren mas instrumentacion

- Actualizacion global de reservas vencidas antes de cada lectura: el plan
  recorrio 4.000 filas y ejecuto en 0,708 ms. No justifica por si solo un cambio.
- Sincronizacion de intentos pendientes con un request externo por intento.
- Busqueda `%texto%` de usuarios con volumen alto.
- Filtros de pagos stale no alineados completamente con indices actuales.
- Tabs mobile montadas despues de visitarlas.
- listas con `ScrollView` para 50 o mas elementos;
- requests no cancelados al cambiar rapidamente filtros;
- bundle web monolitico de 2.607.154 bytes.

## Secuencia propuesta

### Bloque P1: consulta agregada para disponibilidad de areas

Estado: `COMPLETADO Y VALIDADO`.

- Crear un camino de repositorio dedicado para areas.
- Resolver conteos y solapamiento en PostgreSQL.
- Seleccionar solo datos requeridos por el contrato de areas.
- No alterar el endpoint ni su payload.
- No retirar filtros de area/localidad activa.
- No agregar indices en este bloque.

Archivos probables:

- `backend/src/modules/desks/domain/ports/desk-repository.port.ts`
- `backend/src/modules/desks/infrastructure/persistence/prisma-desk.repository.ts`
- `backend/src/modules/desks/application/use-cases/get-available-work-areas.use-case.ts`
- pruebas focalizadas de repositorio y caso de uso;
- documentación de Desks y performance.

Aceptacion:

- igualdad contractual y funcional;
- error rate 0 %;
- p95 menor al baseline por mas del margen de ruido;
- sin regresion relevante en las muestras de memoria comparables;
- tests de disponibilidad, suite backend y E2E aprobados;
- seguridad y filtros activos preservados.

Reversion:

- revertir unicamente el commit del bloque si la mejora no supera el ruido o
  aparece una regresion.

### Bloque P2: reducir amplificacion de requests de Pagos

Estado: `NO APROBADO`.

Requiere definir y autorizar un contrato batch o agregado. No se implementara
como parte de P1.

### Bloque P3: evaluar imagen backend

Estado: `NO APROBADO`.

La imagen medida ocupa 817 MB y la capa de `node_modules` 466 MB. Debe
compararse un empaquetado productivo alternativo sin cambiar runtime ni cadena
de suministro. No es parte de P1.

## Fuera de alcance antes de aprobacion

- modificar codigo o configuracion;
- agregar indices;
- agregar cache;
- cambiar contratos;
- instalar herramientas;
- ejecutar stress o soak;
- medir Mercado Pago real;
- virtualizar listas o agregar memoizacion sin profiling.

## Criterios de cierre

- cada bloque cuenta con baseline y benchmark posterior comparable;
- la mejora supera el margen de ruido;
- no aumenta errores;
- seguridad y comportamiento permanecen intactos;
- validaciones completas aprobadas;
- documentacion y conversacion actualizadas;
- revision independiente completada;
- un commit por bloque, solo luego de validacion.

## Evidencia

Diagnostico completado el 29 de julio de 2026. P1 fue autorizado, implementado
y validado con 0 errores en 1.560 requests, payload identico y reduccion de p95
entre 86,88 % y 94,93 %. La evidencia posterior esta en
`docs/performance/optimization-results.md`.

## Mensaje de commit propuesto

`perf(escritorios): optimizar disponibilidad agregada de areas`
