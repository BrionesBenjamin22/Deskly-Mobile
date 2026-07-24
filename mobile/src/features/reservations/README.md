# Feature Reservations

## Funcionalidad

Listado de reservas propias o administradas, filtros operativos para gestores, cancelacion, validacion de llegada y consulta expandible de la ubicacion asociada al escritorio.

## Vistas y componentes

- `MyReservationsScreen`: coordina carga, estados vacio/error, filtros y acciones segun rol.
- `ReservationList`: representa colecciones sin compartir estado visual entre tarjetas.
- `ReservationCard`: muestra el resumen, acciones permitidas y mantiene el estado expandido de su ubicacion.
- `ReservationLocationDetails`: presenta area, localidad, datos geograficos opcionales y el mapa compacto reutilizado desde `features/desks`, con una accion accesible.

## Service, hook y contrato

- `reservations.service.ts` consume `GET /reservations`, normaliza estados y transforma la relacion `Reservation -> Desk -> WorkArea -> Locality` sin consultas adicionales por tarjeta.
- `useReservations` centraliza carga, error y consultas diferenciadas para gestores.
- `Reservation.location` es opcional para tolerar respuestas anteriores o relaciones incompletas. Incluye identificadores y nombres de area/localidad; direccion y coordenadas son opcionales.

## Permisos

El detalle de ubicacion se muestra a miembros y gestores cuando el backend lo entrega. Las acciones de cancelar y validar llegada mantienen las reglas de rol existentes.

## Validaciones y estados

- Una reserva sin `location` conserva el resumen y no muestra el control expandible.
- Direccion se muestra solo cuando contiene un valor.
- Coordenadas se muestran solo cuando latitud y longitud son numeros finitos y se encuentran dentro de los rangos geograficos validos.
- El mapa interactivo usa esas mismas coordenadas y muestra un unico marcador del establecimiento, sin solicitar ubicacion del dispositivo.
- Carga, error, vacio, respuestas parciales y aislamiento entre tarjetas estan cubiertos por pruebas.

## Errores

Los errores HTTP se normalizan en el service y la pantalla presenta feedback visible y accionable. Los datos relacionados faltantes no interrumpen el renderizado.

## Evidencia de validacion

- Mobile completo: 9 suites y 33 pruebas aprobadas.
- Backend completo: 41 suites y 243 pruebas aprobadas.
- E2E PostgreSQL: 2 suites y 8 pruebas aprobadas sobre `deskly_test` con 17 migraciones.
- Build backend, TypeScript mobile, export web y `git diff --check`: aprobados.
- Validacion manual: se confirmo en pantalla que cada reserva muestra el area y el mapa asociados.
