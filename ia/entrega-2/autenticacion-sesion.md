# Autenticación y sesión

## Solicitud y objetivo

Incorporar registro, login, perfil y cambio de contraseña con JWT, hash seguro
y permisos por rol, manteniendo backend y mobile alineados.

## Funcionalidades realizadas

- registro, login y consulta `/auth/me`;
- actualización de perfil;
- guards JWT y de roles;
- roles `ADMIN`, `GESTOR` y `MIEMBRO`;
- pantalla de autenticación y perfil;
- `PATCH /auth/me/password`;
- modal de cambio de contraseña accesible desde la navegación global.

## Seguridad y validaciones

- contraseña nueva de 8 a 72 caracteres;
- al menos una mayúscula y un número;
- validación de contraseña actual;
- hash nuevo en backend;
- errores seguros `401` y `404`;
- validación mobile en tiempo real y confirmación de coincidencia.

## Decisiones

- navegación basada en `currentScreen`;
- token y sesión propagados por props;
- modal global renderizado en `App.tsx`;
- perfil ADMIN de solo lectura.

## Pendientes transferidos

Persistencia segura de sesión en dispositivo y revocación reforzada, abordadas
posteriormente en la Entrega 3.

## Mensaje de commit propuesto

`feat(auth): integrar autenticacion perfil y cambio de contraseña`
