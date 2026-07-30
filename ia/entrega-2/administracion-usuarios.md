# Administración de usuarios

## Solicitud y objetivo

Permitir que ADMIN gestione usuarios sin exponer esas acciones a otros roles.

## Funcionalidades realizadas

- listado paginado y búsqueda;
- cambio de rol;
- restauración de acceso;
- desbloqueo y reactivación;
- baja lógica;
- acciones administrativas ocultas en mobile para roles no autorizados.

## Seguridad y observaciones

Los endpoints están restringidos a ADMIN. Los cambios de acceso y rol se
resuelven en backend; ocultar acciones en frontend no reemplaza la autorización
del servidor.

## Validación

La evidencia quedó integrada al cierre de la Entrega 2. No se conserva en la
bitácora una cantidad focal independiente para este módulo.

## Mensaje de commit propuesto

`feat(usuarios): agregar gestion administrativa por rol`
