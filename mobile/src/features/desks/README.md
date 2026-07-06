# Feature Desks

## Funcionalidad

Consulta de escritorios disponibles, filtros funcionales por fecha, horario, zona, localidad y area de trabajo, y gestion basica de escritorios desde la pantalla de configuracion.

## Vistas

- `DesksScreen`: lista escritorios disponibles y mantiene el flujo de reserva sobre escritorio concreto.
- `DeskSettingsScreen`: permite crear, editar, habilitar o dar de baja escritorios, y asignarles un area de trabajo.

## Services

- `getAvailableDesks`: consume `GET /desks/availability` con filtros opcionales `zone`, `localityId` y `areaId`.
- `listLocalities`: consume `GET /localities`.
- `listWorkAreas`: consume `GET /work-areas`, opcionalmente filtrado por `localityId`.
- `listAvailableWorkAreas`: consume `GET /work-areas/availability` para obtener areas con escritorios disponibles.
- CRUD de escritorios, descripciones y amenities se mantiene en `desks.service.ts`.

## Hooks

- `useAvailableDesks`: centraliza carga de disponibilidad y manejo uniforme de errores.
- `useDeskSettings`: centraliza carga de catalogos, escritorios y areas de trabajo para configuracion.

## Contratos

Un escritorio puede incluir:

```typescript
{
  areaId?: string;
  area?: {
    id: string;
    name: string;
    localityId: string;
    active: boolean;
    locality?: {
      id: string;
      name: string;
      active: boolean;
    };
  };
}
```

## Permisos

La reserva se realiza con token de usuario autenticado segun el contrato de reservas. La gestion de escritorios conserva las restricciones de navegacion y rol definidas en `App.tsx` y `BottomTabBar`.

## Validaciones

- La fecha y horario se validan en backend mediante el endpoint de disponibilidad.
- Los filtros por localidad y area se envian solo cuando el usuario selecciona una opcion distinta de `Todas`.
- El formulario de escritorios envia solo diferencias reales en edicion.
- El campo `areaId` se envia como UUID cuando se asigna un area.

## Errores

Los errores del service se normalizan con `DeskServiceError` y se muestran en UI con mensajes accionables, manteniendo el estilo actual del proyecto.
