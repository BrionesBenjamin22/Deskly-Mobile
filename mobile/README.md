# Deskly Mobile

## Objetivo

Aplicacion movil Expo/React Native para Deskly. La aplicacion consume el backend de Deskly para consultar disponibilidad, gestionar escritorios, administrar amenities y operar reservas.

## Arquitectura

- `src/theme`: tokens visuales compartidos para colores, espaciado y tipografia.
- `src/components/ui`: componentes reutilizables y sin reglas de negocio.
- `src/config`: configuracion de API y variables publicas de Expo.
- `src/features/desks`: pantallas, componentes, hooks, services y tipos del modulo de escritorios.
- `src/features/reservations`: pantallas, componentes, hooks, services y tipos del modulo de reservas.

## Variables de entorno

El frontend usa variables publicas de Expo para configurar integraciones visibles desde la aplicacion.

Archivo local esperado:

```bash
cp .env.example .env
```

Variables disponibles:

- `EXPO_PUBLIC_API_URL`: URL base del backend. Si no se define, la app usa `http://10.0.2.2:3000` en Android y `http://127.0.0.1:3000` en web/iOS.

En web local, usar `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000` cuando el backend corre en la misma maquina. Esto evita problemas de resolucion IPv6 con `localhost` en Windows.

## Pantalla de escritorios

`DesksScreen` compone:

- titulo principal
- selector horizontal de fechas
- acceso visual a filtros avanzados
- contador de escritorios disponibles
- listado de cards de escritorios
- estado vacio reutilizable
- barra inferior visual

El selector de fechas adapta la cantidad de dias visibles al ancho de pantalla: en mobile muestra menos opciones y en web/tablet muestra mas dias para aprovechar el espacio disponible.

La consulta de disponibilidad valida los filtros desde controles cerrados:

- la fecha se selecciona desde opciones generadas por la aplicacion
- los horarios de filtros avanzados se eligen desde opciones `HH:mm`
- la zona se limita a `A`, `B`, `C` o todas

La confirmacion de reserva valida el formulario antes de llamar al backend:

- `Hora inicio` es obligatoria y debe cumplir formato `HH:mm`
- `Hora fin` es obligatoria y debe cumplir formato `HH:mm`
- `Hora fin` debe ser posterior a `Hora inicio`
- cada error se muestra debajo del campo correspondiente y el campo queda resaltado
- si existe un error de formulario, no se ejecuta la peticion

## Configuracion de escritorios

`DeskSettingsScreen` consume el backend para gestionar:

- escritorios
- amenities

El CRUD simple de amenities permite listar, crear, editar y eliminar elementos mediante el contrato `/amenities`.
Los mensajes de exito y error se muestran de forma visible y se ocultan automaticamente luego de 3 segundos.

Validaciones de formulario:

- el nombre del escritorio es obligatorio
- el nombre del escritorio no puede superar 120 caracteres
- la cantidad de personas es obligatoria
- la cantidad de personas debe ser un numero entero
- la cantidad de personas debe ser mayor o igual a 1
- el nombre de amenity es obligatorio
- el nombre de amenity debe ser texto
- el nombre de amenity no puede superar 120 caracteres
- el tipo de escritorio seleccionado debe ser valido
- la zona debe estar restringida a `A`, `B` o `C`
- los amenities seleccionados deben enviarse como lista valida
- el estado del escritorio debe ser booleano
- los campos invalidos se resaltan visualmente y muestran un mensaje especifico
- las validaciones previsibles se resuelven en frontend antes de llamar al backend
- en edicion se envian solo diferencias reales; si no hay cambios, no se llama al backend

Mensajes de exito de alta y edicion:

- alta de escritorio: `El escritorio se creo correctamente.`
- edicion de escritorio: `Los cambios del escritorio se guardaron correctamente.`
- alta de amenity: `El amenity se creo correctamente.`
- edicion de amenity: `Los cambios del amenity se guardaron correctamente.`
- reserva: `Tu escritorio fue reservado correctamente.`
- los mensajes de exito se muestran en una superficie visible de confirmacion, no como texto tecnico ni silencioso

## Navegacion inferior

La barra inferior muestra accesos a escritorios, reservas y configuracion. La accion `Salir` no se muestra como boton directo por decision de producto.

## Contrato mock

Los tipos de `features/desks/types/desk.types.ts` siguen el contrato actual del backend:

- `Desk.code`, generado automaticamente por el backend y visible solo como dato de lectura
- `Desk.name`
- `Desk.peopleCapacity`
- `Desk.zone` con valores `A`, `B`, `C`
- `Desk.description.description`
- `Desk.amenities[]`
- `Desk.enabled`

El formulario de gestion de escritorios no solicita codigo. En altas y ediciones envia solo datos operativos como nombre, tipo, zona, amenities y estado.

## Manejo de errores

Los services leen `body.message` y `body.error` del backend, priorizando `message` porque contiene el texto accionable para el usuario. Cuando el backend devuelve una lista de mensajes de validacion, se muestra el detalle recibido. Los errores de red, timeout o disponibilidad se presentan con textos de accion claros para que el usuario pueda corregir el problema.

La UI distingue:

- errores de campo: aparecen junto al input y evitan la peticion
- errores de negocio: se muestran mediante card o modal, por ejemplo escritorio no disponible
- errores de red: indican revisar backend, conexion o red local

## Paginacion

Los homes consumen 9 elementos por pagina por defecto. Las pantallas que muestren historial de cambios deben consumirlo con 3 items por pagina cuando el endpoint este disponible.

## Pendientes

- conectar navegacion real para `Mis reservas` y `Perfil`
- incorporar historial de cambios en detalle cuando el backend exponga el endpoint correspondiente
