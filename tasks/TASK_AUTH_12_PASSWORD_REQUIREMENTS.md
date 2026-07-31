| Campo | Contenido |
|---|---|
| `ID` | `AUTH-12` |
| `Modulo` | Backend y mobile: Auth |
| `Estado` | `COMPLETADA` |
| `Dependencia` | Contrato vigente de registro y cambio de contraseña |
| `Implementacion` | `backend/src/modules/auth`, `mobile/src/features/auth` |
| `Validacion` | DTO, validacion frontend, componente, suites completas, builds y `git diff --check` |

# Requisitos dinamicos de contraseña

## Objetivo

Mostrar durante el registro solamente los requisitos de contraseña pendientes y
ocultarlos a medida que se cumplen, manteniendo el mismo contrato en frontend y
backend.

## Contexto inspeccionado

- El registro exigia solamente una longitud de 8 a 72 caracteres.
- El cambio de contraseña ya exigia mayuscula y numero.
- Login valida credenciales existentes y no debe imponer reglas de alta.

## Riesgos heredados

- No aceptar en frontend contraseñas que backend rechace, ni viceversa.
- No revelar reglas durante login ni alterar sus mensajes de error.
- Mantener accesibilidad para cambios dinamicos de contenido.

## Alcance

- Unificar registro con longitud, mayuscula y numero.
- Mostrar requisitos pendientes con region accesible dinamica.
- Ocultar cada requisito inmediatamente al cumplirlo.
- Probar componente, validacion y DTO.

## Fuera de alcance

- Cambiar credenciales existentes.
- Modificar login, sesiones, tokens o navegacion.
- Agregar dependencias.

## Secuencia test-first

1. Caracterizar requisitos pendientes y desaparicion progresiva.
2. Validar las mismas reglas en mobile.
3. Rechazar en DTO las contraseñas que no cumplan el contrato.
4. Ejecutar barrera completa y documentar evidencia.

## Criterios de cierre

- Frontend y backend exigen 8–72 caracteres, una mayuscula y un numero.
- La lista contiene solo requisitos pendientes.
- Login conserva su comportamiento.
- Todas las validaciones automatizables aprueban.

## Evidencia

- Focal backend: 1 suite y 5 pruebas aprobadas.
- Focal mobile: 2 suites y 5 pruebas aprobadas.
- Backend completo: 53 suites y 328 pruebas aprobadas.
- Mobile completo: 24 suites y 92 pruebas aprobadas.
- Build backend y TypeScript mobile aprobados.
- `git diff --check` aprobado.

## Mensaje de commit propuesto

`feat(auth): mostrar requisitos dinamicos de contraseña`
