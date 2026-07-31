# Autenticacion mobile

## Vistas y componentes

- `AuthScreen`: login y registro publico.
- `ProfileScreen`: consulta y edicion del perfil permitido por rol.
- `ChangePasswordModal`: cambio de contrasena y cierre posterior de sesion.
- `PasswordRequirements`: muestra durante el registro solo las reglas de
  contraseña pendientes y las anuncia como region accesible.
- `AuthProvider`: distribuye la sesion autenticada sin prop drilling.
- `useAuth`: expone token, usuario y rol exclusivamente dentro del provider.

## Services

- `auth.service.ts`: contratos HTTP de autenticacion y perfil, timeout y
  clasificacion uniforme de errores.
- `session.service.ts`: persistencia, restauracion y eliminacion segura de las
  credenciales.
- `authenticated-fetch.ts`: renovacion unica en vuelo y reintento de la
  solicitud que recibio `401`.
- `session-runtime.ts`: sesion vigente en memoria y notificacion a `App.tsx`.

## Persistencia de sesion

Android e iOS almacenan access y refresh token bajo claves versionadas en
`expo-secure-store`, con accesibilidad `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.
El perfil y los datos del miembro no se guardan por separado. Al iniciar, el
refresh token se intercambia por un nuevo par y la identidad pública devuelta
por backend.

Comportamientos:

- refresh aceptado: reemplaza localmente las credenciales y restaura la identidad;
- refresh rechazado: elimina ambas credenciales y presenta el login;
- fallo transitorio de red: conserva las credenciales y solicita reintentar;
- logout o cambio de cuenta: elimina primero ambas credenciales y luego limpia UI;
- cambio de contrasena: elimina la sesion anterior y exige autenticarse;
- web: mantiene sesion solo en memoria y no utiliza `localStorage`.

## Permisos y controles

La autorizacion permanece en backend. La restauracion no confia en datos
persistidos del usuario y nunca interpreta el retorno visual como prueba de una
sesion valida. Los errores no incluyen tokens ni respuestas completas.

`ProfileScreen` propaga a la barra inferior los callbacks habilitados por rol.
Para ADMIN incluye Panel, Gestion de usuarios y Cuenta; el cambio de pantalla
continua centralizado en `App.tsx`.

## Validaciones

El registro exige entre 8 y 72 caracteres, al menos una mayuscula y al menos un
numero. Cada requisito desaparece visualmente al cumplirse. Login conserva su
validacion de credenciales existentes sin mostrar estas reglas.

`session.service.test.ts` cubre almacenamiento de ambos tokens, restauracion
autoritativa, rechazo, fallos de red, cierre y ausencia de SecureStore.
`authenticated-fetch.test.ts` cubre renovacion y reintento unico.

## Limites

No se administran sesiones por dispositivo ni biometria. La navegacion,
callbacks, refresh keys y estados de cada flujo permanecen fuera de
`AuthContext`. Tampoco existe deteccion persistente de replay por refresh token;
la revocacion global se mantiene mediante `tokenVersion`.
