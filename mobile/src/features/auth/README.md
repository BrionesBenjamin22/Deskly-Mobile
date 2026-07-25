# Autenticacion mobile

## Vistas y componentes

- `AuthScreen`: login y registro publico.
- `ProfileScreen`: consulta y edicion del perfil permitido por rol.
- `ChangePasswordModal`: cambio de contrasena y cierre posterior de sesion.

## Services

- `auth.service.ts`: contratos HTTP de autenticacion y perfil, timeout y
  clasificacion uniforme de errores.
- `session.service.ts`: persistencia, restauracion y eliminacion segura de la
  credencial.

## Persistencia de sesion

Android e iOS almacenan exclusivamente el access token bajo una clave
versionada en `expo-secure-store`, con accesibilidad
`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`. El perfil, rol y datos del miembro no se
serializan: se reconstruyen mediante `GET /auth/me` antes de habilitar cualquier
vista autenticada.

Comportamientos:

- token aceptado: restaura la sesion con la identidad devuelta por backend;
- token rechazado: elimina la credencial y presenta el login;
- fallo transitorio de red: conserva la credencial y solicita reintentar;
- logout o cambio de cuenta: elimina primero la credencial y luego limpia UI;
- cambio de contrasena: elimina la sesion anterior y exige autenticarse;
- web: mantiene sesion solo en memoria y no utiliza `localStorage`.

## Permisos y controles

La autorizacion permanece en backend. La restauracion no confia en datos
persistidos del usuario y nunca interpreta el retorno visual como prueba de una
sesion valida. Los errores no incluyen tokens ni respuestas completas.

## Validaciones

`session.service.test.ts` cubre almacenamiento exclusivo del token,
restauracion autoritativa, rechazo, fallos de red, cierre y ausencia de
SecureStore. La barrera del modulo incluye TypeScript, suite Jest completa,
matriz Expo, audit productivo y exportacion web.

## Limites

El backend no emite refresh tokens, por lo que no existe rotacion automatica.
Biometria y autenticacion local adicional quedan fuera de esta etapa.
