# Gestion de usuarios

## Alcance

Pantalla exclusiva para administradores que permite listar hasta 9 usuarios por pagina, buscar por nombre, usuario o email, modificar roles, aplicar bajas logicas y restaurar el acceso de cuentas inactivas o bloqueadas por penalizaciones.

El listado presenta primero las cuentas activas y luego las inactivas.

## Componentes y servicios

- `UserManagementScreen`: vista principal con busqueda, paginacion y feedback.
- `ManagedUserCard`: seleccion de rol, estado de bloqueo y acciones de baja o restauracion por usuario.
- `useUserManagement`: coordina consulta y mutaciones, recargando el listado despues de cada cambio.
- `users.service`: consume los endpoints protegidos con JWT.

## Permisos y validaciones

La pestaña `Gestion de usuarios` solo aparece para `ADMIN` y es su pantalla inicial. Para este rol, la barra inferior no expone escritorios, areas de trabajo, reservas ni pagos porque no dispone de acciones operativas sobre esos flujos.

El menu de `Cuenta` se presenta sobre la pantalla y se cierra al tocar cualquier punto fuera de la tarjeta, ademas de cerrarse al elegir una accion.

La interfaz evita cambios sobre la cuenta actual; el backend vuelve a validar el rol, impide la autodesactivacion y protege al ultimo administrador activo.
