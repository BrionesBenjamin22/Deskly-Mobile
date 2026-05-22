# Deskly Mobile

## Objetivo

Aplicacion movil Expo/React Native para Deskly. La primera pantalla implementada es la base visual de consulta de escritorios disponibles, sin conexion al backend.

## Arquitectura inicial

- `src/theme`: tokens visuales compartidos para colores, espaciado y tipografia.
- `src/components/ui`: componentes reutilizables y sin reglas de negocio.
- `src/features/desks`: componentes, pantalla, tipos y datos mock del modulo de escritorios.

## Pantalla de escritorios

`DesksScreen` compone:

- titulo principal
- selector horizontal de fechas
- acceso visual a filtros avanzados
- contador de escritorios disponibles
- listado de cards de escritorios
- estado vacio reutilizable
- barra inferior visual

## Contrato mock

Los tipos de `features/desks/types/desk.types.ts` siguen el contrato actual del backend:

- `Desk.code`
- `Desk.name`
- `Desk.zone` con valores `A`, `B`, `C`
- `Desk.description.peopleCapacity`
- `Desk.description.description`
- `Desk.amenities[]`
- `Desk.enabled`

La UI todavia no consume servicios HTTP. Los datos actuales viven en `features/desks/data/mockDesks.ts`.

## Pendientes

- reemplazar mocks por un service dedicado cuando se conecte el backend
- agregar hooks reutilizables para consulta y filtros
- conectar navegacion real para `Mis reservas`, `Perfil` y `Salir`
- implementar flujo de reserva en una etapa posterior
