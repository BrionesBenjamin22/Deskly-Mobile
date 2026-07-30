# Debug del pipeline mobile

## Solicitud y objetivo

Revisar los fallos producidos por GitHub Actions al integrar el PR #9 a
`main`, corroborar que correspondían a TypeScript y tests mobile y corregirlos
antes de continuar con nuevas funcionalidades.

## Evidencia remota

Run de GitHub Actions: `30568825131`.

Jobs aprobados:

- detección de cambios;
- tests unitarios backend;
- build backend;
- calidad backend;
- E2E PostgreSQL;
- Docker;
- export Expo web.

Jobs fallidos:

- `Mobile calidad`, paso `Validar TypeScript`;
- `Mobile tests`, paso `Ejecutar tests mobile con cobertura`.

## Reproducción local

TypeScript reportó cuatro errores:

1. narrowing incorrecto para `description` en `AdminCatalogScreen`;
2. `zone: ''` incompatible con `DeskPayload`;
3. estilo `amenityOption` inexistente;
4. estilo `amenityOptionSelected` inexistente.

Jest reportó:

- 18 de 19 suites aprobadas;
- 69 de 71 pruebas aprobadas;
- dos fallos en `AdminCatalogScreen.test.tsx`.

## Causas

- El test todavía esperaba la categoría eliminada `Tipos de escritorio`.
- El fixture de escritorio no contenía `areaId`, por lo que el nuevo formulario
  deshabilitaba correctamente el guardado.
- El payload conservaba el valor transitorio vacío de zona.
- Dos estilos usados por el selector de localidades no estaban declarados.

## Correcciones

- narrowing mediante la relación específica de `WorkArea`;
- normalización de zona vacía a `undefined`;
- estilos faltantes incorporados;
- fixture alineado con área y zona;
- expectativa del catálogo actualizada.

## Validación

- TypeScript mobile: aprobado;
- 19 suites mobile y 71 pruebas: aprobadas;
- suite focal de administración: 7 pruebas aprobadas.

## Commit ejecutado

`e6be044 fix(mobile): corregir validaciones del pipeline`
