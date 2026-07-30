# Frontend mobile y correcciones

## Solicitud y objetivo

Consumir el MVP desde Expo, permitir buscar escritorios y reservar, y mantener
feedback visible y navegación simple.

## Funcionalidades realizadas

- catálogo de escritorios;
- filtros de fecha y horario;
- selección y creación de reserva;
- pantalla `Mis reservas`;
- formularios con validación;
- confirmaciones de éxito y conflicto;
- soporte Expo web.

## Decisiones UX y arquitectura

- navegación basada en estado;
- sin router externo;
- feedback visible y accionable;
- reutilización de componentes compatibles.

## Bugs y correcciones

- confirmación visual sin `deskName`;
- error de disponibilidad inestable;
- contrato mobile desalineado con el alcance sin usuarios;
- configuración de conexión progresivamente alineada con backend.

## Validación y pendientes

La evidencia se integra al cierre general de la Entrega 1. Autenticación,
sesión, permisos y experiencia por rol se transfirieron a la Entrega 2.

## Mensaje de commit propuesto

`feat(mobile): integrar escritorios y reservas del mvp`
