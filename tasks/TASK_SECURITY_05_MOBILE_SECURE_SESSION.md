# Persistencia segura de sesion mobile

| Campo | Contenido |
|---|---|
| `ID` | `SECURITY-05` |
| `Modulo` | Mobile, autenticacion y sesion |
| `Estado` | `COMPLETADA` |
| `Dependencia` | `SECURITY-02`, `SECURITY-04` |
| `Implementacion` | `mobile/App.tsx`, `mobile/src/features/auth`, configuracion Expo |
| `Validacion` | Unitarios de sesion, suite mobile, TypeScript, matriz Expo, audit y exportacion web |

## Objetivo

Persistir exclusivamente el access token mediante almacenamiento seguro nativo,
restaurar la identidad contra el backend y eliminar la credencial al cerrar o
cambiar de cuenta.

## Contexto inspeccionado

La sesion solo se conserva en memoria dentro de `App.tsx`. Al reiniciar la app
el usuario debe autenticarse nuevamente. El backend expone `GET /auth/me`, que
permite reconstruir la identidad desde un token todavia valido.

## Riesgos heredados

- Web no dispone de un equivalente nativo a Keychain/Keystore; mantiene sesion
  solo en memoria para no usar `localStorage`.
- Un fallo de red durante la restauracion no debe borrar un token potencialmente
  valido.
- Un token rechazado por el backend debe eliminarse.

## Alcance

- Integrar `expo-secure-store` en Android e iOS.
- Persistir solo el access token, no el perfil ni datos del miembro.
- Validar el token contra `/auth/me` antes de restaurar la sesion.
- Eliminar el token al cerrar sesion, cambiar cuenta o detectar rechazo.
- Cerrar la sesion local despues de un cambio de contrasena exitoso.

## Fuera de alcance

- Refresh tokens, porque el backend no los emite.
- Persistencia web insegura.
- Biometria y autenticacion local adicional.

## Secuencia test-first

1. Probar almacenamiento exclusivo del token.
2. Probar restauracion con identidad autoritativa del backend.
3. Probar eliminacion de tokens rechazados.
4. Probar conservacion ante fallos de red.
5. Integrar el ciclo de vida en `App.tsx`.
6. Ejecutar la barrera completa mobile.

## Criterios de cierre

- Ningun dato personal se serializa en SecureStore.
- La app no muestra contenido autenticado antes de validar el token restaurado.
- Logout y cambio de cuenta eliminan la credencial antes de cerrar la sesion.
- Tests, type-check, matriz Expo, audit y exportacion aprobados.

## Evidencia

- `session.service.test.ts`: 6 casos de persistencia, restauracion, rechazo,
  red, cierre y disponibilidad aprobados.
- `App.test.tsx`: 2 casos de limites de confianza del ciclo de vida aprobados.
- Suite mobile completa: 18 suites y 59 pruebas aprobadas.
- `pnpm run typecheck`: aprobado.
- `pnpm audit --prod`: 0 vulnerabilidades conocidas.
- `pnpm run check:expo`: matriz local SDK 54 aprobada; el endpoint remoto no
  estuvo disponible y Expo utilizo `bundledNativeModules.json`.
- `pnpm run export:web`: aprobado.
- `git diff --check`: aprobado.

La prueba manual nativa de persistencia entre reinicios queda diferida hasta
disponer de un dispositivo o emulador con un nuevo development build, porque
`expo-secure-store` incorpora codigo nativo. Procedimiento: autenticar, cerrar
la aplicacion, abrirla, comprobar restauracion; luego cerrar sesion, reiniciar y
comprobar que vuelve al login.

## Commit propuesto

`feat(auth): persistir la sesion mobile de forma segura`
