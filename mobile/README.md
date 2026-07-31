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
- si el backend todavia no fue inicializado, informa que un responsable debe
  ejecutar el bootstrap administrativo y no muestra el formulario
- el registro publico siempre solicita email, nombre de usuario, contrasena,
  nombre y apellido, DNI y telefono, y solo crea miembros
- replica limites y formatos previsibles del backend
- consume `POST /auth/register`
- vuelve al login con el email precargado y una confirmacion visible

Los errores de formulario se muestran junto al campo y resaltan el input. Los errores de API, red y timeout se presentan mediante `StatusModal` con un llamado a la accion.

En Android e iOS se persiste exclusivamente el access token mediante
`expo-secure-store`. Al iniciar, la aplicacion valida ese token con
`GET /auth/me` antes de mostrar contenido autenticado y reconstruye el perfil
desde la respuesta autoritativa del backend. Un token rechazado se elimina; un
fallo transitorio de red no lo descarta. En web la sesion permanece solo en
memoria para evitar almacenar credenciales en `localStorage`.

## Perfil y cierre de sesion

La barra inferior incorpora la opcion `Perfil`. Al seleccionarla abre un menu reutilizable con:

- `Mi perfil`: consulta `GET /auth/me` con el access token y muestra usuario, email, rol, estado y datos publicos del miembro cuando existe.
- `Cambiar cuenta`: descarta la sesion en memoria y vuelve al login con una indicacion visible.
- `Cerrar sesion`: descarta el access token y los datos de usuario en memoria, reinicia la navegacion y confirma el cierre mediante `StatusModal`.

El backend utiliza JWT stateless, por lo que el logout no crea una blacklist. El
cliente elimina primero el token de SecureStore y solo entonces cierra la
sesion visible. Despues de cambiar la contrasena tambien elimina la credencial y
solicita un nuevo ingreso, porque el backend invalida las sesiones anteriores.

## Variables de entorno

El frontend usa variables publicas de Expo para configurar integraciones visibles desde la aplicacion.

Existe una plantilla por entorno. Solo debe copiarse una como `.env`, evitando
mezclar o mantener varias configuraciones activas:

```bash
# Desarrollo
cp .env.development.example .env

# Testing
cp .env.testing.example .env

# Produccion
cp .env.production.example .env
```

Variables disponibles:

- `EXPO_PUBLIC_API_URL`: URL base unica del backend. Es obligatoria en Android
  e iOS para no confundir emuladores con dispositivos fisicos. Solo web local
  admite `http://127.0.0.1:3000` como valor predeterminado.
- `EXPO_PUBLIC_APP_ENV`: entorno de ejecucion (`development`, `testing` o
  `production`). Cuando vale `production`, la URL de API debe usar HTTPS y la
  aplicacion falla al iniciar si la configuracion es insegura.

La URL se valida al iniciar. Solo acepta HTTP/HTTPS y rechaza credenciales,
query strings y fragmentos. Produccion exige HTTPS.

### Matriz de conectividad

| Ejecucion | `EXPO_PUBLIC_API_URL` |
|---|---|
| Web en el mismo equipo | `http://127.0.0.1:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://127.0.0.1:3000` |
| Expo Go en telefono | `http://IP_LAN_DEL_HOST:3000` |
| Tunnel o testing remoto | URL HTTPS publica del backend |
| Produccion | URL HTTPS estable del backend |

Para Expo Go, el telefono y el equipo deben estar en la misma red, el backend
debe escuchar en `0.0.0.0` y el firewall debe permitir TCP 3000 en redes
privadas. Antes de abrir Expo, comprobar desde el telefono:

```text
http://IP_LAN_DEL_HOST:3000/health
```

La respuesta esperada es `{"status":"ok"}`. Si cambia la red o la IP asignada
por DHCP, actualizar `mobile/.env` y reiniciar Metro con cache limpia:

```bash
pnpm exec expo start --clear --lan
```

No se prueban automaticamente varias URLs: una solicitud autenticada siempre se
envia al unico origen configurado.

### Proxy reverso y API gateway

Deskly conserva un unico backend modular, por lo que un API gateway no aporta
beneficios suficientes en esta etapa. En testing y produccion se recomienda un
proxy reverso delante de Nest para ofrecer un dominio HTTPS estable, terminacion
TLS, limites de tamaño y observabilidad. Un gateway debe reevaluarse cuando
existan varios servicios desplegables o politicas transversales que no convenga
mantener en el monolito.

## Pantalla de escritorios

`DesksScreen` compone:

- titulo principal
- selector horizontal de fechas
- acceso visual a filtros avanzados
- contador de escritorios disponibles
- listado de cards de escritorios
- estado vacio reutilizable
- barra inferior visual

El selector rapido contiene los proximos 30 dias y admite desplazamiento horizontal
con anclaje semanal. Cuando una fecha se selecciona desde `Ver mas fechas`, la
tira se desplaza automaticamente para mantener esa seleccion visible.

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

La visibilidad aplica minimo privilegio por rol:

- `MIEMBRO`: Escritorios, Mis reservas, Pagos y Cuenta.
- `GESTOR`: Reservas y Cuenta.
- `ADMIN`: Panel, Gestion de usuarios y Cuenta.
- Mientras el rol no este disponible, solo se muestra Cuenta.

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

## Actualizacion de contenido

Las vistas de areas de trabajo, escritorios, reservas, pagos y perfil incorporan
`RefreshControl` nativo. El hook compartido `usePullToRefresh` evita solicitudes
manuales simultaneas y mantiene el indicador activo hasta que finaliza la recarga.
Los `refreshKey` existentes se conservan para sincronizar eventos entre pantallas.

## Cadena de suministro

La aplicacion mantiene Expo dentro de la matriz compatible del SDK 54. Las
resoluciones `pnpm.overrides` fijan versiones corregidas de dependencias
transitivas que Expo y React Native aun no incorporan de forma nativa.

Al actualizar Expo o React Native se debe ejecutar:

```bash
pnpm run check:expo
pnpm audit --prod
pnpm run typecheck
pnpm test -- --runInBand
pnpm run export:web
```

Las resoluciones solo deben retirarse cuando el audit permanezca limpio y la
barrera completa resulte aprobada sin ellas.

## Pendientes

- conectar navegacion real para `Mis reservas` y `Perfil`
- incorporar historial de cambios en detalle cuando el backend exponga el endpoint correspondiente
# Contenedor Docker

El `Dockerfile` ofrece una etapa `development` para ejecutar Metro/Expo dentro de
Docker. Las dependencias se instalan en una etapa independiente con lockfile y el
proceso final corre como el usuario no privilegiado `expo`, con telemetria
desactivada y `dumb-init`.

La imagen `node:22-alpine` esta fijada por digest multi-arquitectura. La renovacion
del digest debe ser explicita y debe aprobar la construccion de la etapa
`development` antes de integrarse.

`EXPO_PUBLIC_API_URL` se incorpora al bundle de Expo. En un dispositivo fisico se
debe usar `http://<IP_LAN_DEL_HOST>:3000`; `127.0.0.1` solo apunta al host desde web
o desde entornos donde el dispositivo comparte loopback.
