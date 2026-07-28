| Campo | Contenido |
|---|---|
| `ID` | `ADMIN-01` |
| `Modulo` | Mobile y backend, administracion de elementos del sistema |
| `Estado` | `COMPLETADA` |
| `Dependencia` | Navegacion administrativa consolidada; definicion de las entidades administrables |
| `Implementacion` | `mobile/src/features`, modulos backend correspondientes y documentacion tecnica |
| `Validacion` | Tests unitarios de permisos y formularios, tests backend, contratos HTTP, build, flujo manual y `git diff --check` |

# Catalogo administrativo de elementos del sistema

## Objetivo

Implementar una pantalla exclusiva para administradores que liste los elementos configurables del sistema y permita iniciar sus altas desde un punto central.

## Contexto inspeccionado

La navegacion del administrador dispone de una entrada directa a Gestion de usuarios. La incorporacion del catalogo administrativo fue solicitada como una fase posterior y no forma parte del ajuste actual de navegacion.

El inventario implementado comprende escritorios, tipos de escritorio, amenities, areas de trabajo y localidades.

## Riesgos heredados

- Los CRUD de areas de trabajo y localidades se concentran en un servicio y un controlador por entidad.
- Cada alta debe reutilizar contratos existentes o completar de forma coherente el flujo frontend/backend.
- Los permisos actuales de algunos endpoints deben revisarse antes de exponer acciones administrativas.

## Alcance

- Inventariar con el usuario las entidades administrables.
- Crear el listado central con estados vacio, carga, error y paginacion cuando corresponda.
- Incorporar accesos a formularios de alta respetando la navegacion establecida.
- Validar permisos en frontend y backend.
- Documentar vistas, contratos, reglas de negocio y evidencia de pruebas.

## Fuera de alcance

- Implementar el catalogo durante la fase de navegacion administrativa.
- Crear nuevas entidades sin confirmar primero el inventario funcional.
- Modificar el layout global o migrar el mecanismo de navegacion.

## Secuencia test-first

1. Definir entidades, permisos y contratos.
2. Escribir pruebas de visibilidad y navegacion por rol.
3. Escribir pruebas backend de permisos, validaciones y altas.
4. Implementar services, tipos, hooks, vistas y endpoints faltantes.
5. Ejecutar pruebas unitarias, de integracion, build y prueba manual completa.

## Criterios de cierre

- El administrador visualiza el inventario acordado.
- Cada accion de alta autorizada funciona de extremo a extremo.
- Otros roles no pueden acceder a la pantalla ni a sus endpoints protegidos.
- Los mensajes, paginacion, documentacion y navegacion respetan las convenciones del proyecto.
- La barrera completa de validacion queda registrada con cantidades reales.

## Evidencia

- Mobile: 15 suites y 49 pruebas aprobadas.
- El formulario de escritorios permite agregar y quitar amenities asociados, con cobertura automatizada.
- Altas, ediciones y eliminaciones muestran confirmaciones visuales de exito o error mediante `StatusModal`.
- Las mutaciones autenticadas conservan simultaneamente los headers JSON y Bearer, con prueba de regresion.
- Backend: 45 suites y 273 pruebas aprobadas.
- Seguridad especifica: 15 casos de endpoints administrativos aprobados.
- Servicios de localidades y areas: 4 reglas de dominio aprobadas.
- TypeScript mobile sin errores.
- Build backend aprobado.
- Export web de Expo aprobado.
- ESLint y Prettier aprobados en los archivos backend modificados.
- Prueba manual con sesion ADMIN aprobada: alta de localidad recibida y procesada correctamente despues de corregir los headers autenticados.

## Mensaje de commit propuesto

`feat(administracion): incorporar panel de elementos del sistema`
