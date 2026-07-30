# Escritorios y catálogos

## Solicitud y objetivo

Implementar disponibilidad y CRUD de escritorios, y luego ampliar el modelo
con descripciones reutilizables, zonas `A`, `B`, `C` y amenities.

## Funcionalidades realizadas

- disponibilidad por fecha y franja horaria;
- alta, listado paginado, detalle, edición y baja lógica de escritorios;
- exclusión de escritorios deshabilitados o eliminados;
- `DeskZone`, `DeskDescription`, `Amenity` y `DeskAmenity`;
- CRUD de descripciones y amenities;
- protección de catálogos asociados mediante conflicto `409`.

## Contratos y decisiones

- home paginado con 9 elementos;
- baja lógica mediante `enabled=false` y `deletedAt`;
- reservas bloqueantes solapadas excluyen escritorios;
- reservas canceladas no bloquean;
- la relación escritorio-amenity es many-to-many;
- la migración se generó con Prisma luego de sanear datos incompatibles, según
  la indicación de no escribirla manualmente.

## Bugs y correcciones

- se retiró la dependencia anterior de `locationDescription`;
- se alinearon schema, dominio, DTO, casos de uso, repositorio y controller;
- se protegió la eliminación de catálogos todavía vinculados.

## Validación y observaciones

La validación forma parte del cierre integrado de la Entrega 1: lint, build,
tests y estado de migraciones aprobados. No se registra una prueba manual
independiente por cada catálogo.

## Mensaje de commit propuesto

`feat(escritorios): agregar descripciones zonas y amenities`
