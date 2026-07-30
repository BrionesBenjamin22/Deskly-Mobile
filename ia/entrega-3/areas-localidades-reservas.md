# Áreas, localidades y reservas

## Solicitud y objetivo

Incorporar localidades y áreas de trabajo, mostrar disponibilidad por
ubicación y agregar el detalle de ubicación a las reservas.

## Funcionalidades realizadas

- CRUD de localidades y áreas;
- dirección, latitud y longitud;
- disponibilidad agregada por área;
- pantalla mobile de áreas;
- mapa web/native según plataforma;
- detalle de ubicación en `Mis reservas`;
- filtros y estados reutilizados.

## Decisiones

- áreas y localidades inactivas no se ofrecen;
- la navegación continúa basada en estado;
- los componentes de calendario y fecha existentes se reutilizan;
- el contrato de reserva incorpora la ubicación entregada por backend.

## Validación y pendientes

La funcionalidad de detalle de ubicación quedó registrada como completada en
`TASK_MOBILE_RESERVATIONS_LOCATION_DETAILS.md`. El proveedor de geocodificación
para completar coordenadas automáticamente permanece pendiente en `ADMIN-02`.

## Mensaje de commit propuesto

`feat(ubicaciones): integrar areas y detalle de reservas`
