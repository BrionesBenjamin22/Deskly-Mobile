# Performance y optimizaciones

## Solicitud y objetivo

Construir una línea base reproducible, optimizar un cuello por vez y conservar
contratos, seguridad y equivalencia funcional.

## P1: disponibilidad agregada de áreas

Se reemplazó la materialización de escritorios, relaciones y reservas en Node
por una consulta PostgreSQL agregada y parametrizada.

Resultados:

- reducción de p95 entre `86,88 %` y `94,93 %`;
- aumento de throughput entre `609,56 %` y `1.865,46 %`;
- 780 requests antes y 780 después;
- 0 errores HTTP;
- payloads idénticos por tamaño y SHA-256.

Validación:

- 3 suites y 20 pruebas focalizadas;
- 48 suites y 291 pruebas backend;
- 3 suites y 9 pruebas E2E;
- build y `git diff --check` aprobados.

## P2: resumen paginado de pagos

Se reemplazó el fan-out mobile por una consulta paginada al backend.

Resultados:

- 9 reservas: 21 requests a 1 (`-95,24 %`);
- 50 reservas: 103 requests a 1 (`-99,03 %`);
- 150 reservas: 303 requests a 1 (`-99,67 %`).

No se afirma una mejora de latencia, bytes, CPU o memoria porque no existió un
benchmark HTTP comparable para este bloque.

## P3: artefacto productivo backend

Se generó un árbol portable con `pnpm deploy --prod` y se incluyó
explícitamente el cliente Prisma.

Resultados:

- imagen virtual: 817 MB a 724 MB (`-11,38 %`);
- tamaño inspeccionado: 174.383.125 B a 152.567.797 B (`-12,51 %`);
- inicio TCP mediano: 513,98 ms a 452,97 ms (`-11,87 %`, orientativo);
- memoria anterior: 62,39-75,25 MiB;
- memoria posterior: 69,27-76,20 MiB;
- no se atribuye mejora ni regresión de memoria;
- build frío: 51,64 s a aproximadamente 95 s, regresión documentada;
- build con caché anterior: 1,24-1,37 s;
- build con caché posterior: 1,19-2,69 s.

## Batería, caché y lazy loading

- no existe una medición reproducible de consumo de batería;
- no se implementó caché funcional de datos como parte de estos bloques;
- Metro y Docker utilizan cachés de build, pero no equivalen a una estrategia
  de caché de datos de la aplicación;
- el mapa web usa carga `lazy`;
- las pantallas consultan datos bajo demanda mediante hooks y paginación;
- no se afirma virtualización general de listas ni reducción medida de batería.

## Mensajes de commit propuestos

- `perf(escritorios): optimizar disponibilidad agregada de areas`
- `perf(pagos): reducir amplificacion de consultas mobile`
- `perf(contenedores): reducir artefacto productivo backend`
