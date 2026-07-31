| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-11` |
| `Modulo` | Backend: desks, catalogo, areas, localidades y disponibilidad |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-09`; decision contractual del usuario |
| `Implementacion` | `backend/src/modules/desks/interfaces/http`, documentacion API |
| `Validacion` | Tests de seguridad focales, backend completo, E2E, build, lint, formato, Docker y `git diff --check` |

# Autenticacion obligatoria de consultas de escritorios

## Objetivo

Impedir el acceso sin autenticacion a todas las rutas funcionales de
escritorios, catalogo, areas, localidades y disponibilidad.

## Contexto inspeccionado

Las mutaciones ya aplican `JwtAuthGuard` y restricciones de rol. Las lecturas
permanecen publicas aunque el flujo mobile solo las consume luego del login.
Payments funcional ya esta protegido a nivel de controlador.

## Riesgos heredados

- No proteger webhooks ni retornos del proveedor de pagos: son integraciones
  externas y no reciben el JWT del usuario.
- Mantener las restricciones `ADMIN` y `GESTOR` de las mutaciones.
- No modificar respuestas, DTO, paginacion ni reglas de negocio.
- Actualizar Swagger para que las lecturas declaren Bearer Auth.

## Alcance

- Aplicar `JwtAuthGuard` a todos los controladores HTTP del modulo Desks.
- Probar la metadata de seguridad completa.
- Probar por HTTP que las lecturas rechazan solicitudes sin JWT.
- Actualizar la referencia de deuda y los contratos documentados.

## Fuera de alcance

- Cambiar roles autorizados.
- Proteger `/webhooks/payments` o `/payments/return`.
- Cambiar autenticacion, emision de tokens o frontend.

## Secuencia test-first

1. Agregar pruebas que exijan guard a nivel de cada controlador.
2. Agregar cobertura HTTP de respuestas `401` sin JWT.
3. Aplicar guards y anotaciones Swagger.
4. Ejecutar la barrera focal y completa.

## Criterios de cierre

- Ninguna ruta de Desks es accesible sin un JWT valido.
- Las mutaciones conservan sus roles actuales.
- Payments funcional sigue protegido y sus entradas externas permanecen
  disponibles para el proveedor.
- Documentacion y registro reflejan el contrato real.

## Evidencia

- Test test-first inicial: 5 fallos esperados por ausencia del guard común.
- Seguridad backend focal: 1 suite y 20 pruebas aprobadas.
- Backend completo: 52 suites y 312 pruebas aprobadas.
- E2E HTTP focal: 1 suite y 8 pruebas aprobadas.
- E2E PostgreSQL limpio: 18 migraciones, 3 suites y 17 pruebas aprobadas.
- Mobile focal: 2 suites y 4 pruebas aprobadas.
- Mobile completo: 22 suites y 85 pruebas aprobadas.
- Build backend, TypeScript mobile y export Expo web: aprobados.
- Prettier y ESLint focales: aprobados.
- Build Docker backend y mobile: aprobado.
- Healthchecks de database, backend y mobile: aprobados.
- Comprobacion HTTP anonima: Desks, disponibilidad, catalogo, localidades,
  areas y Payments respondieron `401`.
- Backend `/health`: HTTP 200; Metro: `packager-status:running`.
- `git diff --check`: aprobado.

## Mensaje de commit propuesto

`fix(seguridad): exigir autenticacion en consultas de escritorios`
