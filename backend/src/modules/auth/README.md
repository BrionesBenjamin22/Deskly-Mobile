# Modulo de autenticacion y autorizacion

## Responsabilidad

El modulo administra cuentas de usuario, miembros, autenticacion JWT y autorizacion por roles. Mantiene separadas las credenciales (`User`) de los datos de negocio (`Member`) y registra cada cambio efectivo de rol en `UserRoleHistory`.

## Roles

Los roles validos son exclusivamente:

- `ADMIN`: administra roles de otros usuarios.
- `GESTOR`: rol operativo sin permiso para asignar roles.
- `MIEMBRO`: rol predeterminado de toda cuenta posterior a la inicial.

Ningun payload de registro acepta un campo `role`. El `ValidationPipe` global rechaza campos no declarados y el repositorio asigna el rol dentro de la transaccion.

## Primer administrador

`POST /auth/register` serializa la inicializacion mediante un bloqueo transaccional de PostgreSQL. Si no existe ningun usuario, crea una cuenta `ADMIN` sin `Member`, aunque el payload incluya datos de miembro. No existen credenciales predeterminadas ni secretos hardcodeados.

La primera cuenta debe crearse inmediatamente durante la puesta en marcha controlada del entorno. Las cuentas posteriores requieren `member` y se crean siempre como `MIEMBRO`.

## Modelos y relaciones

### User

- `id`: UUID.
- `email`: unico, normalizado a minusculas.
- `username`: unico, normalizado a minusculas.
- `passwordHash`: hash bcrypt; nunca se expone en respuestas o JWT.
- `role`: `ADMIN`, `GESTOR` o `MIEMBRO`.
- `active`: controla el acceso.
- relacion opcional uno-a-uno con `Member`.

### Member

- `id`: UUID.
- `userId`: relacion unica con `User`.
- `fullName`: nombre y apellido, hasta 200 caracteres.
- `dni`: entero positivo y unico.
- `phone`: entero positivo almacenado como `BIGINT` para admitir numeros telefonicos completos.
- `active`: un miembro inactivo no puede iniciar ni mantener una sesion valida.
- relacion uno-a-muchos con `Reservation`.

El administrador inicial no posee miembro. Toda reserva pertenece obligatoriamente a un miembro mediante `Reservation.memberId`.

### UserRoleHistory

Registra usuario afectado, administrador actor, rol anterior, rol nuevo y fecha. No crea un evento cuando el rol solicitado ya coincide con el actual.

## Endpoints

### GET /auth/registration-status

Endpoint publico y sin datos personales. Responde `{ "requiresMember": false }` cuando todavia no existe ningun usuario y `{ "requiresMember": true }` para todos los registros posteriores. El frontend usa esta informacion solo para renderizar los campos correspondientes; la transaccion de registro vuelve a validar la regla.

### POST /auth/register

Primer usuario:

```json
{
  "email": "admin@example.com",
  "username": "admin",
  "password": "una-clave-segura"
}
```

Usuarios posteriores:

```json
{
  "email": "member@example.com",
  "username": "member",
  "password": "una-clave-segura",
  "member": {
    "fullName": "Nombre Apellido",
    "dni": 12345678,
    "phone": 1123456789
  }
}
```

Responde `201`. Devuelve exclusivamente datos publicos. Conflictos de email, username o DNI responden `409`; ausencia de miembro para usuarios posteriores responde `400`.

### POST /auth/login

```json
{
  "identifier": "member@example.com",
  "password": "una-clave-segura"
}
```

`identifier` acepta email o username. Responde `200` con `access_token` y `user`. Las credenciales invalidas y cuentas inactivas usan una respuesta generica `401` para evitar enumeracion de usuarios.

### GET /auth/me

Requiere `Authorization: Bearer <token>`. Revalida firma, expiracion, existencia y estado actual de usuario/miembro. Responde `401` ante token ausente, invalido o expirado.

Devuelve los datos de cuenta y, para el propio usuario autenticado, nombre completo, DNI y telefono del miembro asociado. Estos datos personales no se incorporan al JWT ni a la respuesta publica de login.

### PATCH /users/:id/role

Requiere JWT y rol actual `ADMIN`.

```json
{
  "role": "GESTOR"
}
```

Un administrador no puede modificar su propio rol. `GESTOR` y `MIEMBRO` reciben `403`.

### GET /users

Requiere JWT y rol `ADMIN`. Devuelve usuarios activos e inactivos con paginacion de 9 elementos por defecto. Admite `page`, `limit` y `search`; la busqueda contempla nombre, username y email.

### DELETE /users/:id

Requiere JWT y rol `ADMIN`. Aplica una baja logica sobre el usuario y su perfil de miembro, preservando sus relaciones e historial. No permite autodesactivacion ni desactivar al ultimo administrador activo.

El cambio de rol tampoco puede degradar al ultimo administrador activo.

## Sesion y JWT

El token incluye `sub`, `email`, `username`, `role`, `active`, `iat` y `exp`. `JWT_EXPIRES_IN` acepta segundos, minutos u horas y no puede superar 3600 segundos. El valor recomendado y predeterminado es `1h`.

No se implementan refresh tokens ni almacenamiento de sesiones. Al expirar el access token, la revalidacion consiste en iniciar sesion nuevamente. El backend nunca prolonga silenciosamente el token.

## Seguridad y errores

- bcrypt con factor de costo 12.
- DTOs con whitelist global, rechazo de campos desconocidos y longitudes acotadas.
- contrasenas de 8 a 72 caracteres para respetar el limite efectivo de bcrypt.
- consulta del usuario actual en cada request protegida para aplicar desactivaciones y cambios de rol inmediatamente.
- errores HTTP sin hashes, secretos ni detalles internos.
- auditoria transaccional de cambios de rol.
- auditoria transaccional de bajas logicas mediante `UserStatusHistory`.

## Variables de entorno

```env
JWT_SECRET=un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=1h
```

`JWT_SECRET` es obligatorio. Nunca debe versionarse un valor productivo.
