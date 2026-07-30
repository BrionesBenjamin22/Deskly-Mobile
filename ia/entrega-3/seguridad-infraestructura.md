# Seguridad e infraestructura

## Solicitud y objetivo

Endurecer autenticación, dependencias, CI, contenedores y conectividad Expo sin
romper el flujo funcional.

## Funcionalidades y correcciones

- autorización de reservas por propietario;
- versión de token para revocación;
- sesión nativa persistida con `expo-secure-store`;
- sesión web únicamente en memoria;
- auditorías y actualizaciones de dependencias;
- remediación de hallazgos GitGuardian;
- credenciales limitadas por job en CI;
- acciones de GitHub fijadas por SHA;
- imágenes Docker fijadas por digest;
- usuario no root, filesystem de solo lectura, capacidades eliminadas y
  `no-new-privileges`;
- conectividad Expo configurable para web, emulador y dispositivo;
- rate limiting en pagos.

## Decisiones y observaciones

- el token nativo usa almacenamiento seguro y accesibilidad posterior al primer
  desbloqueo del dispositivo;
- web no utiliza `localStorage`;
- cerrar sesión elimina el token persistido;
- la configuración productiva restringe orígenes;
- los secretos no se documentan ni se incluyen en frontend.

## Validación registrada

El bloque de contenedores verificó migración, healthcheck, UID 10001,
filesystem read-only, `cap-drop ALL`, `no-new-privileges` y 3 suites E2E con 9
pruebas aprobadas.

## Mensaje de commit propuesto

`fix(seguridad): endurecer sesion ci y contenedores`
