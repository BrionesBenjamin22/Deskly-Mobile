# Tareas pendientes de Mis reservas

## Objetivo

Incorporar en cada tarjeta de `Mis reservas` un detalle secundario con el area de trabajo, la localidad y la informacion de ubicacion disponible, sin implementar mapas ni instalar librerias externas.

Este documento define exclusivamente el trabajo pendiente del frontend mobile. La ejecucion debe ser progresiva, test-first y detenerse para aprobacion despues de cada tarea atomica.

## Estado actual inspeccionado

- `App.tsx` usa navegacion basada en estado. La pestana `reservations` monta `MyReservationsScreen` y le entrega el token, el rol y callbacks de navegacion.
- `MyReservationsScreen` obtiene los datos mediante `useReservations`, separa reservas actuales e historicas, aplica filtros por estado y contempla carga, error y listado vacio.
- Para el rol `GESTOR`, el hook ejecuta consultas separadas de reservas `RESERVED` y `ACTIVE` para la fecha seleccionada. Para otros roles ejecuta un unico listado.
- `ReservationList` renderiza una `ReservationCard` por reserva.
- `ReservationCard` muestra actualmente escritorio, codigo, fecha, horario, estado y, para gestores, miembro y acciones operativas.
- `reservations.service.ts` consume `GET /reservations`, normaliza estados y genera el texto de fecha.
- El tipo `Reservation` no contiene area, localidad, direccion ni coordenadas.
- La respuesta consumida solo contiene identificadores y datos basicos de reserva, escritorio y miembro.
- No existen pruebas mobile especificas para `MyReservationsScreen`, `ReservationCard`, `useReservations` ni `reservations.service.ts`.
- La infraestructura existente usa Jest, `jest-expo` y `@testing-library/react-native`.
- Se pueden reutilizar las convenciones de `WorkAreaCard.test.tsx`, las fixtures de `features/desks/testing` y las pruebas de pantalla de la seccion de escritorios.

## Patron visual recomendado

Usar una seccion expandible dentro de `ReservationCard`, activada mediante un boton accesible `Ver detalles` / `Ocultar detalles`.

La recomendacion se basa en patrones ya presentes:

- `WorkAreaCard` recibe estado `expanded`, expone `accessibilityState` y muestra contenido secundario dentro de la tarjeta.
- `ProfilePenaltiesCard` usa una accion explicita para mostrar u ocultar detalle.
- Los modales existentes se reservan principalmente para confirmaciones, formularios breves y feedback de operaciones.

El detalle debe conservar visible la informacion principal de la reserva y no debe contener un mapa vacio.

## Contrato frontend esperado

El frontend debe recibir los datos relacionados dentro de la respuesta principal de reservas para evitar una consulta por tarjeta. La forma definitiva debe ajustarse al contrato aprobado del backend. Como referencia:

`localityName` representa una localidad geografica generica, por ejemplo Chascomus o La Plata. `address`, `latitude` y `longitude` pertenecen al area de trabajo concreta y deben obtenerse mediante `Reservation -> Desk -> WorkArea`; no deben persistirse en `Locality` ni en `Reservation`.

```ts
type ReservationLocation = {
  areaId: string;
  areaName: string;
  localityId: string;
  localityName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

interface Reservation {
  // Campos actuales.
  location?: ReservationLocation;
}
```

`location` debe ser opcional durante la transicion para que respuestas incompletas no rompan el renderizado. No se debe consultar un endpoint adicional por cada reserva.

## Secuencia test-first

Cada tarea debe completarse, validarse e informarse por separado. No se debe avanzar a la siguiente sin aprobacion explicita.

### F-MR-01: Fixtures de reservas para pruebas

Objetivo unico: crear una factory reutilizable de reservas con variantes completa, sin ubicacion y con datos parciales.

- Modificar solamente archivos bajo `mobile/src/features/reservations/testing`.
- Reutilizar el estilo de `features/desks/testing/desk.fixtures.ts`.
- No modificar tipos productivos ni comportamiento.
- Validacion: TypeScript/Jest debe poder importar las fixtures.
- Commit propuesto: `test(reservations): add reservation detail fixtures`

### F-MR-02: Pruebas de carga y renderizado actual

Objetivo unico: respaldar el comportamiento existente de `Mis reservas` antes de ampliarlo.

- Probar que la pantalla inicia la consulta con el token y parametros correctos.
- Probar listado con varias reservas sin mezclar datos.
- Probar carga, error y listado vacio.
- Probar que una respuesta incompleta no provoca un error de renderizado.
- Aislar solamente el servicio HTTP o el hook segun el nivel de prueba; no reemplazar la logica visible de la pantalla.
- Ejecutar solo la suite agregada y confirmar que describe el comportamiento actual.
- Commit propuesto: `test(reservations): cover current reservations rendering states`

### F-MR-03: Pruebas del mapeo del contrato relacionado

Precondicion: contrato backend de area y localidad aprobado.

Objetivo unico: definir en pruebas como se transforma la respuesta HTTP a `Reservation`.

- Verificar asociacion correcta reserva -> escritorio -> area -> localidad.
- Verificar que dos reservas conservan sus propios datos relacionados.
- Verificar omision segura de direccion y coordenadas opcionales.
- Verificar que no aparezcan valores `undefined` o `null` como texto visible.
- Los tests nuevos deben fallar porque el mapeo aun no existe.
- Commit propuesto: `test(reservations): define related location mapping`

### F-MR-04: Adaptacion minima de tipos y service

Objetivo unico: hacer pasar F-MR-03 sin cambios visuales.

- Ampliar `reservation.types.ts` con un tipo de ubicacion reutilizable.
- Ampliar el tipo privado de respuesta y `mapReservation` en `reservations.service.ts`.
- Mantener compatibilidad con respuestas incompletas.
- No agregar consultas adicionales.
- Validar tests relacionados, TypeScript y linting disponible.
- Commit propuesto: `feat(reservations): map work area and locality details`

### F-MR-05: Pruebas del detalle expandible

Objetivo unico: definir la interaccion visible del componente.

- Probar que la informacion principal permanece visible con el detalle cerrado.
- Probar apertura y cierre mediante una accion accesible.
- Probar area, localidad, direccion y coordenadas cuando existan.
- Probar omision coherente de campos opcionales ausentes.
- Probar que abrir una tarjeta no muestra datos de otra reserva.
- Los tests deben fallar solamente por ausencia del detalle.
- Commit propuesto: `test(reservations): cover expandable reservation details`

### F-MR-06: Componente reutilizable de detalle

Objetivo unico: implementar el componente minimo que haga pasar F-MR-05.

- Crear `ReservationLocationDetails` dentro de la feature.
- Mantener el estado expandido en el nivel que permita independencia entre tarjetas.
- Reutilizar `AppText`, `Icon`, colores y espaciados existentes.
- Incluir `accessibilityRole`, etiqueta clara y `accessibilityState.expanded`.
- No modificar estilos globales ni componentes globales reutilizables.
- Commit propuesto: `feat(reservations): add expandable location details`

### F-MR-07: Pruebas de integracion tarjeta-listado

Objetivo unico: verificar la integracion del detalle en varias tarjetas.

- Probar que cada tarjeta representa la reserva correcta.
- Probar apertura independiente o politica de una tarjeta abierta, segun la implementacion aprobada.
- Probar que filtros y acciones actuales siguen funcionando.
- Probar datos parciales y datos invalidos sin fallos de renderizado.
- Commit propuesto: `test(reservations): verify reservation detail isolation`

### F-MR-08: Integracion en Mis reservas

Objetivo unico: hacer pasar F-MR-07 con el minimo cambio funcional.

- Integrar el detalle en `ReservationCard` y, solo si hace falta, propagar estado desde `ReservationList`.
- No alterar cancelacion, check-in, filtros, calendario ni navegacion.
- Mantener el detalle disponible para las vistas de miembro y gestor salvo una regla de permisos posterior.
- Commit propuesto: `feat(reservations): integrate location details into cards`

### F-MR-09: Pruebas de ubicacion geografica opcional

Precondicion: backend con direccion y coordenadas implementadas.

Objetivo unico: definir la presentacion de los datos preparados para un mapa futuro.

- Probar direccion cuando exista.
- Probar latitud y longitud solo cuando ambas sean validas y esten presentes.
- Probar que coordenadas ausentes no crean placeholders de mapa.
- No probar ni instalar una libreria de mapas.
- Commit propuesto: `test(reservations): cover optional geographic data`

### F-MR-10: Integracion de datos geograficos

Objetivo unico: hacer pasar F-MR-09.

- Exponer los datos como texto secundario o mediante una estructura interna reutilizable.
- No implementar mapa, geocodificacion ni solicitudes externas.
- Evitar renders y transformaciones repetidas innecesarias.
- Commit propuesto: `feat(reservations): display optional geographic details`

### F-MR-11: Regresion y documentacion final

Objetivo unico: validar el modulo completo y actualizar su documentacion estable.

- Ejecutar suites de reservas y escritorios relacionadas.
- Ejecutar TypeScript y linting disponible, registrando por separado errores preexistentes.
- Validar manualmente carga, error, vacio, apertura/cierre y dos reservas con ubicaciones diferentes.
- Actualizar el README del modulo con componentes, hook, service, contrato, permisos, validaciones y estados.
- Commit propuesto: `docs(reservations): document reservation location details`

## Archivos probablemente involucrados

- `mobile/src/features/reservations/screens/MyReservationsScreen.tsx`
- `mobile/src/features/reservations/components/ReservationCard.tsx`
- `mobile/src/features/reservations/components/ReservationList.tsx`
- `mobile/src/features/reservations/components/ReservationLocationDetails.tsx`
- `mobile/src/features/reservations/hooks/useReservations.ts`
- `mobile/src/features/reservations/services/reservations.service.ts`
- `mobile/src/features/reservations/types/reservation.types.ts`
- `mobile/src/features/reservations/testing/reservation.fixtures.ts`
- Pruebas colocadas junto a componentes, pantalla y service segun las convenciones actuales.

## Fuera de alcance

- Implementar un mapa interactivo.
- Instalar una libreria de mapas.
- Geocodificar direcciones.
- Cambiar el router state-based de `App.tsx`.
- Modificar layout global, auth, hooks compartidos, estilos base o componentes globales.
- Crear consultas HTTP por cada tarjeta.
