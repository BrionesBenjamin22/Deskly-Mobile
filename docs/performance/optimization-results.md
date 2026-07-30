# Resultados de optimizacion de performance

## Bloque P1: disponibilidad agregada de areas

- Fecha: 29 de julio de 2026.
- Base: commit `9568dbe`.
- Cambio: consulta agregada parametrizada en PostgreSQL.
- Contrato publico: sin cambios.
- Dataset: fixture `docs/performance/fixtures/baseline.sql`.
- Comparacion: implementacion anterior y posterior contra la misma base,
  proceso production, puerto, hardware y script.
- Requests: 780 antes y 780 despues.
- Errores HTTP: 0 antes y 0 despues.

## Comparacion

Se usa la mediana del p95 y throughput de tres repeticiones.

| Flujo | Metrica | Antes | Despues | Diferencia | Variacion | Resultado |
| ----- | ------: | ----: | ------: | ---------: | --------: | --------- |
| Areas ocupadas c1 | p95 | 84,38 ms | 11,07 ms | -73,31 ms | -86,88 % | Aceptada |
| Areas ocupadas c10 | p95 | 663,90 ms | 33,65 ms | -630,25 ms | -94,93 % | Aceptada |
| Areas disponibles c1 | p95 | 80,18 ms | 10,22 ms | -69,96 ms | -87,25 % | Aceptada |
| Areas disponibles c10 | p95 | 658,52 ms | 42,20 ms | -616,32 ms | -93,59 % | Aceptada |
| Areas ocupadas c1 | Throughput | 15,80 req/s | 112,11 req/s | +96,31 req/s | +609,56 % | Aceptada |
| Areas ocupadas c10 | Throughput | 17,46 req/s | 343,17 req/s | +325,71 req/s | +1.865,46 % | Aceptada |
| Areas disponibles c1 | Throughput | 15,21 req/s | 116,81 req/s | +101,60 req/s | +667,98 % | Aceptada |
| Areas disponibles c10 | Throughput | 17,28 req/s | 274,52 req/s | +257,24 req/s | +1.488,66 % | Aceptada |

## Resultados crudos

### Antes

| Escenario | c | p95, tres repeticiones | Throughput, tres repeticiones |
| --------- | -: | ----------------------: | --------------------------------: |
| Ocupadas | 1 | 78,87 / 84,38 / 84,81 ms | 15,94 / 15,64 / 15,80 req/s |
| Ocupadas | 10 | 671,37 / 663,90 / 646,28 ms | 17,46 / 18,60 / 17,23 req/s |
| Disponibles | 1 | 79,20 / 80,18 / 87,48 ms | 15,82 / 15,21 / 14,99 req/s |
| Disponibles | 10 | 662,04 / 654,21 / 658,52 ms | 16,84 / 17,28 / 17,71 req/s |

### Despues

| Escenario | c | p95, tres repeticiones | Throughput, tres repeticiones |
| --------- | -: | ----------------------: | --------------------------------: |
| Ocupadas | 1 | 11,07 / 10,38 / 12,96 ms | 111,28 / 115,81 / 112,11 req/s |
| Ocupadas | 10 | 96,50 / 32,17 / 33,65 ms | 267,09 / 345,36 / 343,17 req/s |
| Disponibles | 1 | 14,57 / 9,77 / 10,22 ms | 104,52 / 116,81 / 118,78 req/s |
| Disponibles | 10 | 39,50 / 42,20 / 47,73 ms | 269,85 / 279,76 / 274,52 req/s |

La primera repeticion posterior de ocupadas c10 tuvo un p95 de 96,50 ms. Se
conserva como variacion real y no se descarta; incluso ese valor queda muy por
debajo del minimo anterior de 646,28 ms.

## Equivalencia funcional

Las respuestas anteriores y posteriores fueron identicas:

| Escenario | Bytes antes | Bytes despues | SHA-256 |
| --------- | -----------: | ------------: | ------- |
| Ocupadas | 12 | 12 | `3731ac9c...655b9` |
| Disponibles | 38.605 | 38.605 | `25abc58f...2675` |

El valor exploratorio previo de 35.113 bytes correspondia a una carga
sintetica anterior que no quedo reproducida exactamente. Se excluye de la
comparacion contractual y se reemplaza por la medicion estricta.

## Cambio realizado

`findAvailableWorkAreasByTimeSlot` dejo de materializar escritorios, relaciones
y reservas para agruparlos en Node. Una unica consulta:

- filtra escritorios habilitados y no eliminados;
- exige area y localidad activas;
- preserva filtros por zona, area y localidad;
- considera bloqueantes `PENDING_PAYMENT`, `RESERVED` y `ACTIVE`;
- mantiene solapamiento half-open;
- calcula totales y disponibilidad con `COUNT FILTER` y `NOT EXISTS`;
- omite areas completamente ocupadas;
- conserva el orden publico.

La consulta usa `Prisma.sql` y parametros; no concatena entradas del usuario.

## Validacion

- Pruebas focalizadas: 3 suites, 20 pruebas aprobadas.
- Backend completo: 48 suites, 291 pruebas aprobadas.
- E2E en base limpia migrada: 3 suites, 9 pruebas aprobadas.
- Build backend: aprobado.
- `git diff --check`: aprobado.
- Revision independiente: aprobada.

Una corrida E2E inicial sobre el fixture de performance fallo en
`auth-bootstrap` porque la prueba exige una base sin usuarios. No fue una
regresion de P1: se repitio correctamente en una segunda base limpia y quedaron
aprobadas las 9 pruebas.

## Seguridad y mantenibilidad

No se modificaron controllers, DTOs, autenticacion, autorizacion, rate limiting,
auditoria ni manejo seguro de errores. Se retiro procesamiento redundante de
Node y se documento la semantica SQL en el modulo.

## Limitaciones

- No se afirma mejora de memoria: solo existe una muestra posterior y la
  presion del host difirio.
- No se midio CPU de forma comparable.
- Los tests unitarios cubren filtros, estados y limites; no existe un E2E
  dedicado para cada combinacion de filtros.
- Los resultados corresponden al hardware y dataset documentados.

## P2: resumen paginado de pagos

### Problema original

La pantalla de Pagos descargaba todas las paginas de reservas en tres estados,
consultaba intentos y cotizacion por cada reserva, filtraba aprobados y recien
entonces paginaba de a 9. El minimo era `3 + 2R` requests, mas paginas
adicionales.

### Linea base y resultado

El harness determinista de orquestacion se ejecuto 30 veces con Node 22.17.0
sobre el mismo equipo. Confirma conteo y pico concurrente, no latencia HTTP
productiva.

| Reservas | Requests antes | Pico antes | Requests despues | Diferencia | Variacion |
| --------: | -------------: | ---------: | ----------------: | ---------: | --------: |
| 9 | 21 | 9 | 1 | -20 | -95,24 % |
| 50 | 103 | 50 | 1 | -102 | -99,03 % |
| 150 | 303 | 150 | 1 | -302 | -99,67 % |

### Cambio

- nuevo `GET /payments/summary?page&limit`, con limite maximo 9;
- `memberId` derivado exclusivamente del JWT;
- sincronizacion de candidatos antes de filtrar intentos aprobados;
- pricing y moneda calculados por backend;
- paginacion posterior al filtro, equivalente al flujo anterior;
- una llamada mobile por carga, pagina o recarga;
- endpoints anteriores preservados.

Se mantuvo deliberadamente la sincronizacion de todos los candidatos para no
perder aprobaciones tardias. P2 reduce amplificacion HTTP; no afirma reducir
todavia el fan-out interno al gateway.

### Validacion

- focal P2 backend: 4 suites, 16 pruebas;
- Payments backend: 22 suites, 156 pruebas;
- backend completo: 51 suites, 299 pruebas;
- mobile focal: 3 suites, 9 pruebas;
- mobile completo: 19 suites, 71 pruebas;
- build backend y type-check mobile aprobados;
- `git diff --check` aprobado.

### Seguridad y limitaciones

JWT, propiedad por miembro, rate limiting, validacion de pagina/limite,
sincronizacion autoritativa, errores seguros y separacion de estados de pago y
reserva permanecen activos. No se usaron datos reales ni Mercado Pago real.
No se afirma mejora de latencia, bytes, CPU o memoria porque no hubo benchmark
HTTP integrado anterior/posterior bajo condiciones equivalentes.
