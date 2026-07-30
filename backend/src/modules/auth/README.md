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

Endpoint publico y sin datos personales. Responde `requiresMember: true` en
todos los casos y `registrationAvailable` indica si el administrador inicial ya
fue creado. El frontend no habilita el formulario mientras el sistema no fue
inicializado; la transaccion de registro vuelve a validar la regla.

## Inicializacion administrativa

El registro HTTP nunca asigna el rol `ADMIN`. Antes de habilitar registros, un
responsable debe definir temporalmente:

```env
BOOTSTRAP_ADMIN_EMAIL=
BOOTSTRAP_ADMIN_USERNAME=
BOOTSTRAP_ADMIN_PASSWORD=
```

La contrasena debe tener entre 12 y 72 caracteres e incluir mayuscula,
minuscula y numero. Luego se ejecuta:

```bash
pnpm admin:bootstrap
```

En la imagen backend compilada:

```bash
node dist/src/commands/bootstrap-admin.js
```

El comando obtiene un lock transaccional, exige una base sin usuarios, crea un
unico `ADMIN` con bcrypt costo 12 y no imprime credenciales. Las tres variables
de bootstrap deben retirarse inmediatamente despues. Una segunda ejecucion
falla sin modificar datos.

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

`identifier` acepta email o username. Responde `200` con `access_token`,
`refresh_token` y `user`.

### POST /auth/refresh

Recibe `{ "refreshToken": "..." }` y responde un nuevo par de access y refresh
tokens junto con el usuario publico. El token se verifica con un secreto
independiente, exige el claim `tokenType=refresh` y revalida `tokenVersion`,
estado del usuario, estado del miembro y bloqueos vigentes. Un rechazo responde
`401` sin exponer detalles de firma.

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

Requiere JWT y rol `ADMIN`. Devuelve usuarios activos primero y luego inactivos, ordenados por username dentro de cada grupo, con paginacion de 9 elementos por defecto. Admite `page`, `limit` y `search`; la busqueda contempla nombre, username y email.

### DELETE /users/:id

Requiere JWT y rol `ADMIN`. Aplica una baja logica sobre el usuario y su perfil de miembro, preservando sus relaciones e historial. No permite autodesactivacion ni desactivar al ultimo administrador activo.

El cambio de rol tampoco puede degradar al ultimo administrador activo.

### PATCH /users/:id/access

Requiere JWT y rol `ADMIN`. Restaura una cuenta desactivada o bloqueada por penalizaciones: activa el usuario y su miembro, elimina `blockedUntil` y registra al administrador actor en `UserStatusHistory`.

## Sesion y JWT

El access token incluye `sub`, `email`, `username`, `role`, `active`,
`tokenVersion`, `iat` y `exp`. El refresh token incluye solamente `sub`,
`tokenType`, `tokenVersion`, `iat` y `exp`.
`JWT_EXPIRES_IN` acepta segundos, minutos, horas o dias y no puede superar siete
dias. El valor recomendado y predeterminado es `1h`.

El refresh token usa secreto y expiracion independientes y se reemplaza en la
respuesta de cada renovacion. No se almacena en base de datos. Cada cambio de
contrasena incrementa `tokenVersion`; todos los access y refresh tokens emitidos
anteriormente dejan de ser validos inmediatamente.

## Seguridad y errores

- bcrypt con factor de costo 12.
- DTOs con whitelist global, rechazo de campos desconocidos y longitudes acotadas.
- contrasenas de 8 a 72 caracteres para respetar el limite efectivo de bcrypt.
- consulta del usuario actual en cada request protegida para aplicar desactivaciones y cambios de rol inmediatamente.
- limite por instancia y direccion de origen de 10 intentos de login, 5
  registros y 30 consultas del estado de registro por minuto. En despliegues
  con multiples replicas, el almacenamiento del throttler debe reemplazarse por
  uno compartido.
- errores HTTP sin hashes, secretos ni detalles internos.
- auditoria transaccional de cambios de rol.
- auditoria transaccional de bajas logicas mediante `UserStatusHistory`.
- inicializacion administrativa fuera de los endpoints publicos.

## Variables de entorno

```env
JWT_SECRET=un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=otro_secreto_largo_y_aleatorio
JWT_REFRESH_EXPIRES_IN=30d
```

Ambos secretos son obligatorios, deben ser diferentes y nunca deben
versionarse con valores productivos.
