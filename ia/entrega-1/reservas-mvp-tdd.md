# Reservas MVP y revisión de TDD

## Solicitud y objetivo

Implementar creación, consulta, edición y cancelación de reservas conforme a
los TDD-0002 a TDD-0005, sin incorporar usuarios durante esta entrega.

## Funcionalidades realizadas

- creación de reserva por escritorio, fecha y horario;
- listado, detalle y edición;
- cancelación lógica por `PATCH` y `DELETE`;
- persistencia de `cancelledAt`;
- restricción PostgreSQL contra reservas activas superpuestas;
- datos de respuesta suficientes para confirmación visual.

## Contratos y decisiones

- `memberId` quedó fuera del contrato de la Entrega 1;
- `404` para escritorio o reserva inexistente;
- `409` para escritorio no disponible o cancelación repetida;
- `400` para una franja horaria inválida;
- una reserva cancelada libera disponibilidad.

## Revisión funcional

- TDD-0003: cobertura parcial mediante el listado de reservas activas;
- TDD-0004: cancelación, persistencia y liberación verificadas;
- TDD-0005: se agregó `deskName` y se estabilizó el conflicto para permitir
  confirmación visual mobile.

## Pendientes transferidos

`/reservations/me`, autenticación, propiedad, privacidad y asociación con el
miembro autenticado.

## Mensaje de commit propuesto

`feat(reservas): completar crud cancelacion y confirmacion`
