# Remediacion vigente de dependencias mobile

| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-04` |
| `Modulo` | Mobile, Expo y cadena de suministro |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-01`, auditoria integral del 25 de julio de 2026 |
| `Implementacion` | `mobile/package.json`, `mobile/pnpm-lock.yaml`, `mobile/README.md` |
| `Validacion` | Matriz Expo, audit productivo, TypeScript, unitarios, exportacion web y diff check |

## Objetivo

Eliminar los advisories productivos de la aplicacion mobile sin migrar de
Expo SDK 54 ni alterar el comportamiento visual.

## Contexto inspeccionado

`pnpm audit --prod` informo vulnerabilidades transitivas en herramientas
incluidas por Expo y React Native. La matriz oficial instalada tambien indico
que Expo debia actualizarse dentro del mismo SDK.

## Riesgos heredados

- Las resoluciones deben retirarse cuando Expo y React Native incorporen esas
  versiones de forma nativa.
- Una actualizacion futura de SDK debe repetir las pruebas de compatibilidad
  porque algunas resoluciones cruzan versiones mayores transitivas.
- Nuevos advisories pueden aparecer aunque el lockfile no cambie.

## Alcance

- Actualizar Expo de `~54.0.33` a `~54.0.36`.
- Fijar versiones corregidas de Babel, utilidades de archivos, parsers,
  WebSocket y herramientas transitivas vulnerables.
- Mantener React Native `0.81.5` y la matriz del SDK 54.

## Fuera de alcance

- Migracion a un SDK mayor de Expo.
- Cambios de interfaz o comportamiento funcional.
- Persistencia segura de la sesion, tratada por separado.

## Secuencia test-first

1. Capturar audit y rutas de dependencia.
2. Verificar la matriz de compatibilidad de Expo.
3. Actualizar Expo dentro del mismo SDK.
4. Aplicar resoluciones corregidas a las transitivas restantes.
5. Repetir audit y la barrera completa mobile.

## Criterios de cierre

- Matriz de Expo sin dependencias incompatibles.
- Audit productivo sin vulnerabilidades conocidas.
- Type-check y suite mobile sin regresiones.
- Exportacion web aprobada.
- Lockfile reproducible y diff check aprobado.

## Evidencia

- `pnpm run check:expo`: dependencias actualizadas.
- `pnpm audit --prod`: 0 vulnerabilidades conocidas.
- `pnpm run typecheck`: aprobado.
- Mobile: 16 suites y 51 pruebas aprobadas.
- `pnpm run export:web`: aprobado.
- `git diff --check`: aprobado.

## Commit propuesto

`fix(seguridad): remediar dependencias productivas de mobile`
