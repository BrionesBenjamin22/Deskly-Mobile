# Bootstrap administrativo seguro

| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-02` |
| `Modulo` | Backend y mobile, autenticacion |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-01` |
| `Implementacion` | `backend/src/modules/auth`, `backend/src/commands`, `mobile/src/features/auth` |
| `Validacion` | Unitarios backend, build, migraciones limpias, E2E PostgreSQL, tests mobile y ejecucion real del comando |

## Objetivo

Evitar que el primer visitante de una instalacion vacia obtenga el rol
`ADMIN`. La cuenta administrativa inicial se crea mediante un comando backend
de un solo uso y el registro HTTP queda reservado para miembros.

## Contexto inspeccionado

El repositorio asignaba `ADMIN` al primer usuario dentro de la transaccion de
registro publico. El lock evitaba dos administradores concurrentes, pero no
acreditaba que el primer solicitante fuera el responsable del despliegue.

## Riesgos heredados

- Las variables de bootstrap deben inyectarse solo durante la inicializacion y
  retirarse despues.
- El despliegue debe ejecutar migraciones antes del comando.
- La perdida de la contrasena administrativa se resuelve por un procedimiento
  operativo separado, no reejecutando el bootstrap.

## Alcance

- Comando `admin:bootstrap` con validacion, bcrypt costo 12, transaccion y lock.
- Rechazo si ya existe cualquier usuario.
- Bloqueo del registro publico mientras la base no fue inicializada.
- Registro HTTP limitado permanentemente al rol `MIEMBRO`.
- Contrato móvil para informar que la inicializacion esta pendiente.
- Documentacion de variables y ejecucion local o compilada.

## Fuera de alcance

- Recuperacion de cuentas administrativas.
- Invitaciones administrativas.
- Provision automatica desde un gestor de secretos cloud.

## Secuencia test-first

1. Probar validacion de credenciales, hash y reejecucion.
2. Probar el estado de registro antes y despues del bootstrap.
3. Probar que el endpoint publico solo crea miembros.
4. Ejecutar el comando real dos veces sobre PostgreSQL temporal.
5. Ejecutar suites completas, build y comprobaciones de Git.

## Criterios de cierre

- Ningun endpoint publico asigna `ADMIN`.
- El comando no persiste ni imprime la contrasena.
- Una segunda ejecucion no modifica datos.
- Frontend y backend comparten el contrato `registrationAvailable`.
- La barrera automatizada queda aprobada.

## Evidencia

- Servicio de bootstrap: 3 pruebas unitarias aprobadas.
- Estado de registro: 2 pruebas unitarias aprobadas.
- Backend completo: 46 suites y 281 pruebas aprobadas.
- Build backend aprobado.
- Base temporal: 18 migraciones aplicadas desde cero.
- E2E PostgreSQL: 3 suites y 9 pruebas aprobadas.
- Mobile: 16 suites y 51 pruebas aprobadas.
- Comando real: primera ejecucion aprobada; segunda ejecucion rechazada.
- `git diff --check`: aprobado.

## Commit propuesto

`fix(auth): asegurar bootstrap del administrador inicial`
