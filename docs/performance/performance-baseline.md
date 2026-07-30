# Linea base de performance

## Identificacion

- Fecha: 29 de julio de 2026.
- Commit: `9568dbe` (`merge(main): reconciliar historial documental de entregas`).
- Rama: `dev`.
- Estado inicial: worktree limpio.
- Alcance: diagnostico; sin cambios de codigo.
- Seguridad: auditorias `SECURITY-01` a `SECURITY-08` completadas previamente.

## Entorno

| Componente | Valor |
| ---------- | ----- |
| Sistema operativo | Windows 11 Pro 10.0.26200, x64 |
| CPU | Intel Core i5-1235U, 10 nucleos, 12 procesadores logicos |
| Memoria fisica | 16.070 MB |
| Memoria disponible observada | 3.644 MB |
| Node | 22.17.0 |
| pnpm | 10.33.2 |
| Docker Engine | 29.4.0 |
| PostgreSQL | 17 Alpine, tag local `postgres:17-alpine` |
| Backend | NestJS compilado, `NODE_ENV=production`, puerto local 3100 |
| Gateway de pagos | `FAKE` |

No se exponen secretos. Las credenciales utilizadas pertenecen exclusivamente a
un contenedor temporal local.

## Dataset

Base temporal: `deskly_performance`, publicada solo en
`127.0.0.1:55432`.

- 18 migraciones reales aplicadas desde cero.
- 11 localidades, incluida la localidad versionada inicial.
- 101 areas, incluida el area versionada inicial.
- 1.000 escritorios.
- 1.000 usuarios y miembros sinteticos.
- 4.000 reservas `RESERVED`.
- Fecha de reservas: 1 de agosto de 2026.
- Cuatro franjas no solapadas por escritorio.
- Sin datos productivos ni Mercado Pago real.
- `ANALYZE` ejecutado despues de la carga.

## Herramientas disponibles

- Node `fetch` y `performance.now`.
- PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)`.
- PowerShell `Measure-Command`, procesos y memoria.
- Docker `stats`, `history` e `images`.
- Expo export.
- Jest y TypeScript.

No existen scripts versionados de k6, autocannon, Artillery, Clinic, APM,
React Profiler ni metricas Prisma/pool. No se instalo ninguna herramienta.

## Metodologia HTTP

- 3 requests de warm-up por escenario.
- 30 requests con concurrencia 1.
- 100 requests con concurrencia 10 cuando aplica.
- Un solo proceso backend.
- Una sola base y dataset.
- Tres repeticiones independientes para el flujo critico de areas; cada
  repeticion tuvo su propio warm-up.
- Respuesta consumida completamente.
- Duracion individual medida desde el cliente local.
- Percentiles calculados sobre la muestra ordenada.
- Error: excepcion de red o HTTP no exitoso.

No se ejecuto stress ni soak. La concurrencia 10 se eligio para observar
degradacion moderada dentro de un entorno local descartable.

## Resultados API

| Escenario | Metrica | Resultado | Variabilidad | Condicion | Evidencia |
| --------- | ------: | --------: | -----------: | --------- | --------- |
| Disponibilidad escritorios | p50 | 82,72 ms | muestra de 30 | c1 | Node fetch |
| Disponibilidad escritorios | p95 | 114,19 ms | muestra de 30 | c1 | Node fetch |
| Disponibilidad escritorios | p99 | 122,12 ms | muestra de 30 | c1 | Node fetch |
| Disponibilidad escritorios | throughput | 11,42 req/s | 0 % errores | c1 | Node fetch |
| Disponibilidad escritorios | payload medio | 713.924 B | estable | c1/c10 | body completo |
| Disponibilidad escritorios | p50 | 751,12 ms | muestra de 100 | c10 | Node fetch |
| Disponibilidad escritorios | p95 | 863,56 ms | muestra de 100 | c10 | Node fetch |
| Disponibilidad escritorios | p99 | 926,22 ms | muestra de 100 | c10 | Node fetch |
| Disponibilidad escritorios | throughput | 13,34 req/s | 0 % errores | c10 | Node fetch |
| Areas ocupadas | p95 | 65,08 ms | 60,90-69,75 ms | c1, 3x30 | Node fetch |
| Areas ocupadas | p95 | 659,10 ms | 474,12-752,42 ms | c10, 3x100 | Node fetch |
| Areas ocupadas | throughput | 18,69 req/s | 16,45-20,46 | c1 | Node fetch |
| Areas ocupadas | throughput | 18,53 req/s | 15,49-23,11 | c10 | Node fetch |
| Areas ocupadas | payload | 12 B | estable | c1/c10 | `{"areas":[]}` |
| Areas disponibles | p95 | 80,20 ms | 53,60-84,67 ms | c1, 3x30 | Node fetch |
| Areas disponibles | p95 | 640,35 ms | 471,02-778,87 ms | c10, 3x100 | Node fetch |
| Areas disponibles | throughput | 16,93 req/s | 14,74-20,44 | c1 | Node fetch |
| Areas disponibles | throughput | 18,41 req/s | 15,01-23,19 | c10 | Node fetch |
| Areas disponibles | payload | 38.605 B | estable | comparación estricta | 100 areas |
| Escritorios pagina 9 | p50 | 19,33 ms | muestra de 30 | c1 | Node fetch |
| Escritorios pagina 9 | p95 | 24,17 ms | muestra de 30 | c1 | Node fetch |
| Escritorios pagina 9 | p99 | 28,28 ms | muestra de 30 | c1 | Node fetch |
| Escritorios pagina 9 | throughput | 50,33 req/s | 0 % errores | c1 | Node fetch |
| Escritorios pagina 9 | payload medio | 5.512 B | estable | c1 | body completo |
| Reservas gestor pagina 50 | p50 | 33,62 ms | muestra de 30 | c1 | JWT sintetico |
| Reservas gestor pagina 50 | p95 | 41,21 ms | muestra de 30 | c1 | JWT sintetico |
| Reservas gestor pagina 50 | p99 | 41,89 ms | muestra de 30 | c1 | JWT sintetico |
| Reservas gestor pagina 50 | throughput | 28,82 req/s | 0 % errores | c1 | Node fetch |
| Reservas gestor pagina 50 | p50 | 119,77 ms | muestra de 100 | c10 | JWT sintetico |
| Reservas gestor pagina 50 | p95 | 174,50 ms | muestra de 100 | c10 | JWT sintetico |
| Reservas gestor pagina 50 | p99 | 181,81 ms | muestra de 100 | c10 | JWT sintetico |
| Reservas gestor pagina 50 | throughput | 77,25 req/s | 0 % errores | c10 | Node fetch |

## Base de datos

### Consulta representativa de disponibilidad actual

- 4.000 filas retornadas.
- 9,001 ms de ejecucion.
- sort quicksort de 347 kB.
- 90 buffers compartidos leidos desde cache.
- PostgreSQL eligio scans secuenciales por el tamaño y selectividad del
  dataset; no constituye evidencia para agregar un indice.

### Consulta agregada experimental

Se ejecuto solamente como `EXPLAIN ANALYZE`, sin modificar codigo:

- 100 grupos de area.
- 1,998 ms.
- 87 buffers compartidos.
- sin indice nuevo.

La equivalencia semantica con el contrato actual no fue demostrada. El
resultado solo justifica evaluar el candidato mediante pruebas de igualdad; no
demuestra una mejora HTTP implementada.

### Actualizacion de reservas vencidas

El `UPDATE` previo a lecturas:

- recorrio 4.000 filas;
- actualizo 0;
- ejecuto en 0,708 ms;
- removio 4.000 filas por filtro.

No es un cuello significativo con este volumen. Se conserva como hipotesis
para datasets mayores y no se propone modificar su semantica de frescura.

## Mobile y web

### Export web

Tres ejecuciones:

- 22,104 s;
- 11,281 s;
- 15,177 s.

Metro informo tiempos de bundling de 2.016 ms, 1.572 ms y 2.259 ms.

Artefactos:

- JavaScript: 2.607.154 B.
- logo: 134.505 B.
- export total: 2.757.430 B.
- 2.107 modulos.

La variabilidad es alta; una diferencia pequeña no puede considerarse mejora.
No existe analyzer configurado para atribuir peso por dependencia.

### Validacion mobile

- Jest: 19 suites y 69 pruebas aprobadas.
- Tiempo Jest: 43,298 s.
- Tiempo de pared: 48,135 s.
- TypeScript: aprobado en 27,431 s.

No se midieron frames, hilo JavaScript, render commits, inicio native o memoria
en dispositivo porque no se definio un dispositivo/emulador reproducible.

## Build, inicio y recursos

Backend build, tres ejecuciones:

- 21,226 s;
- 16,680 s;
- 16,960 s.

Salida compilada:

- 619 archivos;
- 1.394.924 B.

Inicio backend compilado, tres ejecuciones calientes contra la misma base:

- 4.278,2 ms;
- 4.043,2 ms;
- 4.002,1 ms.

Muestra posterior a benchmarks:

- backend: aproximadamente 101.695.488 B de working set;
- PostgreSQL temporal: 44,5 MiB;
- error rate de escenarios validos: 0 %.

Imagenes locales previamente construidas:

- backend runtime: 817 MB;
- capa `node_modules`: 466 MB;
- mobile development: 755 MB;
- capa `node_modules` mobile: 447 MB.

La imagen mobile es de desarrollo y no se compara con un artefacto productivo.

## Incidencias y resultados excluidos

- El primer `docker run` excedio el timeout del shell, pero el contenedor
  termino iniciando correctamente.
- Dos cargas SQL fallaron por nombres de enum; PostgreSQL revirtio las
  transacciones. La carga valida posterior se verifico por conteos.
- Una medicion autenticada se ejecuto sin token porque Docker no era accesible
  desde el sandbox. Produjo 100 % de errores y fue excluida. Se repitio con
  permisos, JWT sintetico y 0 % de errores.
- Un intento inicial de build sin `DATABASE_URL` fallo durante
  `prisma generate`; se repitio con la URL temporal.

## Comandos y escenario reproducible

Comandos oficiales utilizados:

```powershell
docker run --name deskly-performance-postgres -e POSTGRES_USER=deskly_perf -e POSTGRES_PASSWORD=deskly_perf_local -e POSTGRES_DB=deskly_performance -p 127.0.0.1:55432:5432 -d postgres:17-alpine
$env:DATABASE_URL='postgresql://deskly_perf:deskly_perf_local@127.0.0.1:55432/deskly_performance'
backend\node_modules\.bin\prisma.CMD migrate deploy --schema backend/prisma/schema.prisma
Get-Content docs/performance/fixtures/baseline.sql | docker exec -i deskly-performance-postgres psql -U deskly_perf -d deskly_performance
pnpm --dir backend run build
$env:NODE_ENV='production'
$env:PORT='3100'
$env:PAYMENT_GATEWAY='FAKE'
$env:JWT_SECRET='performance-local-only-secret-2026-07-29'
node backend/dist/src/main.js
node docs/performance/scripts/areas-benchmark.js
Get-Content docs/performance/scripts/areas-explain.sql | docker exec -i deskly-performance-postgres psql -U deskly_perf -d deskly_performance
```

El fixture completo, incluidos identificadores, relaciones, franjas, conteos y
`ANALYZE`, esta versionado en
`docs/performance/fixtures/baseline.sql`. Debe ejecutarse sobre una base
temporal migrada desde cero.

Parametros HTTP exactos:

```text
GET /work-areas/availability?date=2026-08-01&startTime=08%3A30&endTime=09%3A30
GET /work-areas/availability?date=2026-08-01&startTime=13%3A00&endTime=14%3A00
```

El cliente ejecutable completo esta en
`docs/performance/scripts/areas-benchmark.js`.

Las dos consultas completas estan en
`docs/performance/scripts/areas-explain.sql`. La segunda es un candidato
experimental cuya equivalencia funcional debe demostrarse antes de usarla.

## Resultados exploratorios iniciales de areas

| Escenario | c | Rep. | p50 | p95 | p99 | Media | req/s | Errores | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Ocupadas | 1 | 1 | 50,15 | 65,08 | 90,37 | 52,15 | 19,17 | 0 | 12 |
| Ocupadas | 1 | 2 | 46,16 | 60,90 | 71,80 | 48,86 | 20,46 | 0 | 12 |
| Ocupadas | 1 | 3 | 59,21 | 69,75 | 70,07 | 60,77 | 16,45 | 0 | 12 |
| Ocupadas | 10 | 1 | 425,80 | 474,12 | 528,40 | 417,75 | 23,11 | 0 | 12 |
| Ocupadas | 10 | 2 | 652,71 | 752,42 | 774,96 | 627,48 | 15,49 | 0 | 12 |
| Ocupadas | 10 | 3 | 582,20 | 659,10 | 676,39 | 568,39 | 16,98 | 0 | 12 |
| Disponibles | 1 | 1 | 49,15 | 53,60 | 54,25 | 48,92 | 20,44 | 0 | 35.113 |
| Disponibles | 1 | 2 | 61,91 | 80,20 | 87,74 | 64,04 | 15,61 | 0 | 35.113 |
| Disponibles | 1 | 3 | 64,12 | 84,67 | 89,70 | 67,83 | 14,74 | 0 | 35.113 |
| Disponibles | 10 | 1 | 423,06 | 471,02 | 493,09 | 416,52 | 23,19 | 0 | 35.113 |
| Disponibles | 10 | 2 | 572,13 | 640,35 | 681,09 | 567,53 | 17,03 | 0 | 35.113 |
| Disponibles | 10 | 3 | 656,89 | 778,87 | 806,29 | 645,37 | 15,01 | 0 | 35.113 |

Estos resultados se conservaron como evidencia exploratoria. El payload de
35.113 B revelo que esa carga inicial no coincidia exactamente con el fixture
posteriormente versionado. La comparacion de aceptacion se repitio con el mismo
fixture para ambos codigos y se registra en `optimization-results.md`.

## Repetibilidad

Para repetir:

1. usar el mismo commit y hardware;
2. iniciar PostgreSQL 17 en `127.0.0.1:55432`;
3. aplicar las 18 migraciones;
4. cargar el dataset con la cardinalidad y franjas documentadas;
5. ejecutar `ANALYZE`;
6. compilar con `pnpm run build`;
7. iniciar backend production con gateway fake;
8. aplicar 3 warm-ups;
9. repetir las mismas cantidades y concurrencia;
10. registrar percentiles, throughput, errores, payload y recursos.

No deben compararse resultados obtenidos con otro volumen, hardware, gateway o
nivel de concurrencia.
