# Debug de login y navegación

## Solicitud y objetivo

Diferenciar los rechazos de login, corregir errores custom en React Native y
estabilizar la navegación autenticada.

## Casos tratados

- credenciales incorrectas: `401`;
- cuenta desactivada: `401` con `ACCOUNT_INACTIVE`;
- cuenta bloqueada: `401` con `blockedUntil`;
- teléfono extenso rechazado durante registro;
- navegación inestable luego de integrar ramas;
- cambio de contraseña no disponible desde todas las pantallas.

## Correcciones

- `StatusModal` con títulos específicos;
- `Object.setPrototypeOf(this, Clase.prototype)` en errores custom;
- detección doble mediante `instanceof` y `error.name`;
- callbacks de navegación propagados desde `App.tsx`;
- contratos backend/mobile alineados;
- restauración administrativa del acceso bloqueado.

## Resultado

El usuario recibe feedback específico y accionable, y las rutas visibles se
ajustan al rol. La autorización real continúa en backend.

## Mensaje de commit propuesto

`fix(auth): diferenciar errores y estabilizar navegacion`
