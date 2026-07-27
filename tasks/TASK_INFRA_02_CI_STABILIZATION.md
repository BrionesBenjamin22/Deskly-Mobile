| Campo          | Contenido                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------- |
| ID             | `INFRA-02`                                                                                |
| Modulo         | Infraestructura CI y validacion backend/mobile                                            |
| Estado         | `EN_PROGRESO`                                                                             |
| Dependencia    | `SECURITY-06`, `SECURITY-07`                                                              |
| Implementacion | `.github/workflows/ci.yml`, fuentes TypeScript validadas por Prettier                     |
| Validacion     | Formato, lint, builds, tests unitarios, E2E PostgreSQL, export Expo y `git diff --check`  |

# Estabilizacion del workflow de CI

## Objetivo

Corregir los fallos observados en GitHub Actions sin depender de credenciales
persistentes para servicios efimeros y alinear el formato versionado con la
validacion automatica.

## Contexto inspeccionado

El run `30173683409` del commit `35446a3` aprobo los builds de backend, Expo y
Docker. Fallaron el formato backend, las validaciones backend/mobile y la
inicializacion del servicio PostgreSQL E2E.

La reproduccion local confirmo 89 archivos backend fuera del formato esperado.
Los tests y TypeScript aprobaron localmente:

- backend: 47 suites y 287 pruebas;
- mobile: 19 suites y 69 pruebas;
- mobile TypeScript: sin errores.

El servicio PostgreSQL fallaba antes del checkout y dependia de secretos de
repositorio. Para una base aislada y efimera del runner no se requieren
credenciales persistentes.

## Riesgos heredados

- Los logs completos de los pasos fallidos no estan disponibles localmente
  porque GitHub CLI no esta instalada.
- Una diferencia de recursos o plataforma del runner puede no reproducirse en
  Windows.

## Alcance

- Aplicar el formato configurado por el backend.
- Inicializar PostgreSQL E2E con autenticacion `trust` limitada al contenedor
  efimero del runner.
- Generar un secreto JWT aleatorio y efimero durante el job.
- Reproducir los comandos exactos del workflow.

## Fuera de alcance

- Cambios de comportamiento funcional.
- Credenciales de produccion o sandbox.
- Modificaciones visuales.

## Secuencia test-first

1. Reproducir cada paso fallido sin modificar fuentes.
2. Registrar la causa confirmada.
3. Aplicar el ajuste minimo.
4. Repetir formato, lint, builds, tests y E2E.
5. Verificar el nuevo run en GitHub Actions despues del push.

## Criterios de cierre

- Prettier y ESLint aprueban.
- Backend compila y aprueba todas sus pruebas unitarias.
- Mobile aprueba TypeScript, pruebas y export Expo.
- E2E aprueba contra PostgreSQL sin secretos persistentes.
- `git diff --check` aprueba.
- El workflow remoto aprueba despues del push.

## Evidencia

- Prettier backend: aprobado sobre `src/**/*.ts` y `test/**/*.ts`.
- ESLint backend: aprobado sin errores ni advertencias.
- Backend unitario con cobertura y reporte JSON: 47 suites y 287 pruebas
  aprobadas.
- Backend E2E PostgreSQL con 18 migraciones aplicadas: 3 suites y 9 pruebas
  aprobadas.
- Backend build: aprobado.
- Mobile TypeScript: aprobado.
- Mobile con cobertura y reporte JSON: 19 suites y 69 pruebas aprobadas.
- Mobile Expo export web: aprobado.
- Validacion remota: pendiente de ejecutar luego del proximo push.

## Mensaje de commit propuesto

`fix(ci): estabilizar las validaciones automatizadas`
