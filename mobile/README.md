# Deskly Mobile

## Objetivo

Aplicacion movil Expo/React Native para Deskly. La aplicacion consume el backend de Deskly para consultar disponibilidad, gestionar escritorios, administrar amenities y operar reservas.

## Arquitectura

- `src/theme`: tokens visuales compartidos para colores, espaciado y tipografia.
- `src/components/ui`: componentes reutilizables y sin reglas de negocio.
- `src/config`: configuracion de API y variables publicas de Expo.
- `src/features/desks`: pantallas, componentes, hooks, services y tipos del modulo de escritorios.
- `src/features/reservations`: pantallas, componentes, hooks, services y tipos del modulo de reservas.
- `src/features/auth`: pantalla, componentes, validaciones, service y tipos de autenticacion.

## Autenticacion

`AuthScreen` presenta un acceso simple que alterna entre inicio de sesion y registro sin agregar una dependencia de navegacion. Reutiliza los componentes globales `ScreenContainer`, `Card`, `Input`, `Button`, `AppText` y `StatusModal`.

Login:

- acepta email o nombre de usuario
- valida identificador y contrasena antes de llamar al backend
- consume `POST /auth/login`
- conserva la sesion en memoria durante esta primera etapa
- habilita el contenido principal despues de mostrar la confirmacion

Registro:

- consulta `GET /auth/registration-status` al abrir el formulario
- si no existen usuarios, muestra solamente los datos de cuenta para crear el administrador inicial
- si ya existen usuarios, agrega nombre y apellido, DNI y telefono para crear el miembro asociado
- para registros posteriores solicita email, nombre de usuario, contrasena, nombre y apellido, DNI y telefono
- replica limites y formatos previsibles del backend
- consume `POST /auth/register`
- vuelve al login con el email precargado y una confirmacion visible

Los errores de formulario se muestran junto al campo y resaltan el input. Los errores de API, red y timeout se presentan mediante `StatusModal` con un llamado a la accion. En esta etapa no se agrega persistencia segura del token ni recuperacion automatica de sesion; esas responsabilidades quedan separadas para el siguiente paso del flujo de autenticacion.

## Perfil y cierre de sesion

La barra inferior incorpora la opcion `Perfil`. Al seleccionarla abre un menu reutilizable con:

- `Mi perfil`: consulta `GET /auth/me` con el access token y muestra usuario, email, rol, estado y datos publicos del miembro cuando existe.
- `Cambiar cuenta`: descarta la sesion en memoria y vuelve al login con una indicacion visible.
- `Cerrar sesion`: descarta el access token y los datos de usuario en memoria, reinicia la navegacion y confirma el cierre mediante `StatusModal`.

El backend utiliza JWT stateless, por lo que el logout no crea una blacklist ni una sesion persistida: el cliente deja de enviar el token descartado.

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
- el filtro `Hasta` solo muestra horarios posteriores al valor elegido en `Desde`
- la zona se limita a `A`, `B`, `C` o todas
- los escritorios con reservas activas superpuestas se muestran como no disponibles
- la tarjeta informa en rojo la reserva que cruza con la franja seleccionada, por ejemplo `Reservado de 09:00 a 13:00`
- si no hay cruce, la tarjeta puede informar la proxima reserva posterior a la hora `Desde`
- los filtros avanzados incluyen un boton de icono para limpiar la seleccion y volver a `Desde 09:00`, `Hasta 18:00` y todas las zonas

La confirmacion de reserva valida el formulario antes de llamar al backend:

- `Hora inicio` es obligatoria y debe cumplir formato `HH:mm`
- `Hora fin` es obligatoria y debe cumplir formato `HH:mm`
- `Hora fin` debe ser posterior a `Hora inicio`
- cada error se muestra debajo del campo correspondiente y el campo queda resaltado
- si existe un error de formulario, no se ejecuta la peticion
- al confirmar una reserva se refresca la disponibilidad y se notifica a `Mis reservas` para actualizar el listado sin recargar la pagina

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
- el nombre de amenity puede contener letras, numeros, espacios y apostrofe para pulgadas, pero debe incluir al menos una letra
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

La barra inferior muestra accesos a escritorios, reservas y perfil. Las acciones de cuenta se agrupan en el menu de perfil para evitar controles innecesarios en la navegacion principal.

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
