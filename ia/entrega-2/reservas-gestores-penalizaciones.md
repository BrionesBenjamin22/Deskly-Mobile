# Reservas, gestores y penalizaciones

## Solicitud y objetivo

Asociar reservas con miembros autenticados, limitar el acceso por propietario y
habilitar la operación del gestor para check-in, ausencias y penalizaciones.

## Funcionalidades realizadas

- entidad `Member` asociada a `User`;
- `memberId` derivado del usuario autenticado;
- MIEMBRO limitado a reservas propias;
- listado operativo ampliado para roles autorizados;
- check-in exclusivo de GESTOR;
- filtro por fecha;
- registro de ausencia;
- penalización activa y bloqueo temporal;
- consulta de penalizaciones propias o de terceros según rol.

## Decisiones y seguridad

- ADMIN no ejecuta check-in;
- MIEMBRO solo opera sus reservas;
- el bloqueo informa una fecha de desbloqueo;
- la autorización se valida en backend y se refleja en mobile.

## Bugs y correcciones

Se corrigió un flujo en el que algunas reservas no quedaban vinculadas al
miembro autenticado, alineando controller, caso de uso, repositorio y contrato.

## Mensaje de commit propuesto

`feat(reservas): asociar miembros y operar penalizaciones`
