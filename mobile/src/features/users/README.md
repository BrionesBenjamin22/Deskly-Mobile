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

El item `Gestion Usuarios` solo aparece para `ADMIN`. La interfaz evita cambios sobre la cuenta actual; el backend vuelve a validar el rol, impide la autodesactivacion y protege al ultimo administrador activo.
