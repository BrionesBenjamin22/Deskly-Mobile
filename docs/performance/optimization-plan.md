# Plan de optimizacion de performance

## Estado

Diagnostico completado. P1 fue autorizado, implementado y validado. Cada bloque
posterior requiere aprobacion explicita e independiente.

## Matriz de oportunidades

| Oportunidad | Evidencia | Area | Metrica actual | Mejora esperada | Confianza | Costo | Riesgo | Archivos | Validacion |
| ----------- | --------- | ---- | -------------- | ---------------- | --------- | ----- | ------ | -------- | ---------- |
| P1 Consulta agregada de disponibilidad de areas | Se materializan 1.000 desks y 4.000 reservas; areas ocupadas y disponibles tienen latencia similar pese a payloads de 12 B y 35.113 B | Backend/DB | p95 c1 53,60-84,67 ms; c10 471,02-778,87 ms | A determinar; debe superar el ruido medido | Media-alta | Medio | Bajo-medio | repositorio/puerto/caso de uso Desks y tests | Igualdad semantica, benchmark 3x, tests y recursos |
| P2 Evaluar endpoint paginado/agregado para Pagos | Formula estatica `3 + paginas + 2R`; 103 con R=50 | Mobile/backend | Requests confirmados; impacto temporal no medido | Pendiente de medicion | Media | Alto | Medio; contrato nuevo | Payments mobile/backend | requests, bytes, p50/p95/p99 pantalla-ready, auth y rate limiting |
| P3 Empaquetado productivo backend | Imagen 817 MB; `node_modules` 466 MB | Docker | 817 MB | Menor transferencia y almacenamiento; magnitud a medir | Alta sobre tamaño | Medio | Medio; Prisma/OpenSSL | Dockerfile y lock/config | build limpio, imagen, inicio, health, E2E |
| P4 Instrumentar consultas/pool | No hay query count/duracion ni pool saturation | Observabilidad | Sin metrica | Habilitar diagnosticos futuros, no mejora directa | Alta | Medio | Bajo-medio; costo de telemetria | Prisma/infra | overhead, redaccion, seguridad |
| P5 Cancelar requests mobile obsoletos | Hooks ignoran respuesta pero no cancelan fetch | Mobile | No medido | Menor red ante filtros rapidos | Baja hasta medir | Medio | Medio | hooks y services | 20 cambios de filtro, requests/bytes, estados |
| P6 Virtualizar listas largas | ScrollView en reservas/desks | Mobile | No hay frames/render profiling | Desconocida | Baja | Medio | Medio; UX | listas/pantallas | dispositivo fijo, 9/50/200 items |

## 1. Alto impacto y bajo riesgo

### P1: disponibilidad agregada de areas

Estado: `COMPLETADO`. No cambio contrato ni seguridad. Mantiene:

- filtros de escritorio, area y localidad activa;
- estados bloqueantes;
- semantica exacta de solapamiento;
- conteos `availableDeskCount` y `totalDeskCount`;
- autorizacion y validacion existentes.

No se agregaran indices. El plan SQL experimental fue mas corto, pero todavia
debe demostrarse su equivalencia funcional y su efecto HTTP.

## 2. Alto impacto y riesgo medio

### P2: contrato agregado de Pagos

Requiere autorizacion especifica para ampliar el contrato publico. Debe
preservar:

- propiedad de reservas;
- sincronizacion autoritativa;
- rate limiting;
- estados de pago y reserva separados;
- errores seguros;
- paginacion de 9.

No se implementara hasta medir la pantalla contra backend local y definir el
payload.

### P3: empaquetado Docker backend

La mejora afecta despliegue, no latencia funcional. Debe conservar imagen
fijada, usuario no root, Prisma, OpenSSL, `dumb-init`, filesystem read-only y
healthcheck.

## 3. Impacto medio

### P4: observabilidad DB/pool

Es habilitadora, no una optimizacion. Debe evaluarse por overhead y por riesgo de
filtrar SQL o datos. No registrar payloads, tokens ni PII.

## 4. Mejoras menores o pendientes de evidencia

- cancelacion de requests al cambiar filtros;
- virtualizacion de listas;
- lazy loading de pantallas;
- optimizacion de logo;
- memoizacion de componentes.

No se implementaran sin profiling native o de red.

## 5. Cambios no recomendados

- cachear disponibilidad: invalidacion compleja ante reservas, cancelaciones,
  check-in, holds y vencimientos;
- retirar reserved slots del contrato: cambia comportamiento mobile;
- paralelizar reconciliacion sin conocer limite del proveedor;
- mover finalizacion de reservas fuera del request sin definir frescura y
  operacion;
- agregar indices por intuicion;
- desactivar logs, validacion, auth o rate limiting;
- virtualizar listados de 9;
- agregar `memo`, `useMemo` o `useCallback` indiscriminadamente;
- usar Mercado Pago real en benchmarks.

## Bloque P1 detallado

### Objetivo

Evitar construir entidades Desk completas para calcular disponibilidad de
areas.

### Cambio propuesto

Agregar una consulta dedicada que:

1. filtra escritorios y relaciones activas;
2. determina solapamiento en PostgreSQL;
3. agrupa por area;
4. retorna unicamente datos y conteos requeridos;
5. conserva la salida publica existente.

### Archivos esperados

- `backend/src/modules/desks/domain/ports/desk-repository.port.ts`
- `backend/src/modules/desks/infrastructure/persistence/prisma-desk.repository.ts`
- `backend/src/modules/desks/application/use-cases/get-available-work-areas.use-case.ts`
- pruebas unitarias/focalizadas correspondientes;
- README de Desks;
- documentos de performance y tarea.

### Tests

- igualdad con area totalmente disponible;
- area parcialmente disponible;
- area totalmente ocupada;
- filtros por localidad, area y zona;
- entidades inactivas o eliminadas;
- estados bloqueantes y no bloqueantes;
- limites horarios exactos;
- regresion completa backend y E2E aplicable.

### Benchmark posterior

Mismo commit base mas un unico cambio, hardware, PostgreSQL, 1.000 desks, 4.000
reservas, fecha, horarios, warm-up y concurrencia.

Capturar:

- p50, p95, p99;
- throughput;
- errores;
- bytes;
- filas y buffers;
- working set posterior y memoria del contenedor PostgreSQL.

### Aceptacion

- contrato exacto;
- 0 % errores;
- mejora de p95 superior a la variabilidad de la muestra;
- sin regresion material en recursos;
- todas las pruebas aprobadas;
- revision independiente;
- un commit aislado.

### Reversion

Revertir solamente el commit P1 si no demuestra mejora suficiente o introduce
una regresion.
