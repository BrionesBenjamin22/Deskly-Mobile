# Conectividad unificada entre Expo y backend

| Campo          | Valor                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ID             | `INFRA-01`                                                                                                                     |
| Modulo         | Mobile e infraestructura                                                                                                       |
| Estado         | `PENDIENTE`                                                                                                                    |
| Dependencia    | `PAYMENTS-07` pendiente; `MOBILE-RESERVATIONS-LOCATION` completada                                                             |
| Implementacion | `mobile/src/config`, variables Expo, proxy reverso, Docker Compose y despliegue backend                                        |
| Validacion     | Expo web, emulador Android, dispositivo fisico en LAN, tunnel HTTPS, build, pruebas de configuracion y documentacion operativa |

## Objetivo

Definir una estrategia unica y predecible para que Expo web, emuladores y dispositivos fisicos consuman el backend sin depender de interpretaciones ambiguas de `localhost` o `127.0.0.1`.

## Contexto inspeccionado

- `mobile/src/config/api.ts` utiliza `EXPO_PUBLIC_API_URL` y recurre a `http://127.0.0.1:3000`.
- En Expo web, `127.0.0.1` representa el equipo donde corre el navegador.
- En un dispositivo fisico, `127.0.0.1` representa el propio telefono y no el equipo que ejecuta Nest.
- La URL correcta puede variar entre navegador local, emulador Android, simulador iOS, dispositivo en LAN, tunnel HTTPS y despliegue cloud.
- La configuracion global de API y la infraestructura son areas sensibles; no deben modificarse durante el cierre de Payments.

## Alternativas a evaluar

### A. Una variable por ejecucion

Configurar una sola `EXPO_PUBLIC_API_URL` por entorno o comando:

- web local: `http://127.0.0.1:3000`;
- dispositivo en LAN: `http://IP_LAN_DEL_HOST:3000`;
- Android Emulator: `http://10.0.2.2:3000`;
- tunnel o cloud: URL HTTPS publica.

Ventaja: implementacion minima. Riesgo: configuracion manual y diferencias entre dispositivos.

### B. Perfiles Expo diferenciados

Definir perfiles de desarrollo, testing y produccion que inyecten una URL unica por build o sesion. No agregar varias URLs activas ni fallback silencioso en runtime.

Ventaja: comportamiento explicito y reproducible. Riesgo: requiere disciplina de ejecucion y documentacion.

### C. Proxy reverso o Backend for Frontend

Exponer una URL estable HTTPS que enrute al backend y usarla en todos los clientes.

Ventaja: unifica origen, TLS, CORS, observabilidad y despliegue. Riesgo: agrega infraestructura y disponibilidad operativa.

### D. API gateway

Evaluar un gateway solo si existen varios servicios, politicas transversales o necesidad real de rate limiting, autenticacion central, versionado y balanceo.

Ventaja: prepara crecimiento a microservicios. Riesgo: complejidad innecesaria mientras exista un unico backend modular.

## Hipotesis inicial

Para el estado actual del proyecto, priorizar perfiles Expo con una unica URL explicita por entorno y una URL HTTPS estable para integraciones externas. Adoptar un API gateway cuando existan multiples servicios o requisitos transversales que justifiquen su costo.

## Alcance

- Disenar matriz entorno-dispositivo-URL.
- Validar que Nest escuche en una interfaz accesible y que firewall/CORS lo permitan.
- Evitar listas de URLs con reintentos automaticos que oculten errores o envien tokens a destinos inesperados.
- Documentar comandos de inicio por plataforma.
- Evaluar proxy reverso, tunnel de desarrollo y endpoint cloud.
- Definir healthcheck y diagnostico visible de la URL activa sin exponer secretos.
- Agregar pruebas unitarias para la resolucion de configuracion.

## Fuera de alcance

- Modificar `App.tsx`, auth, router o componentes globales durante Payments.
- Introducir un API gateway antes de comparar costo y necesidad.
- Descubrir hosts arbitrariamente desde el dispositivo.
- Versionar IPs personales, tokens de tunnel o credenciales.

## Secuencia test-first

1. Escribir pruebas de resolucion para web, Android emulator, dispositivo fisico y produccion.
2. Definir el contrato de variables por entorno.
3. Implementar la alternativa seleccionada con una unica URL efectiva.
4. Validar healthcheck desde cada plataforma.
5. Ejecutar flujos autenticados y de pagos sin exponer JWT ni secretos.
6. Documentar operacion, errores y recuperacion.

## Criterios de cierre

- Cada plataforma resuelve una URL documentada y comprobable.
- No se usa `localhost` o `127.0.0.1` incorrectamente desde dispositivos fisicos.
- No existen fallbacks hacia multiples origenes para solicitudes autenticadas.
- Desarrollo, testing y produccion quedan diferenciados.
- La alternativa elegida incluye justificacion frente a proxy y API gateway.
- Build, pruebas y validacion manual por plataforma aprobados.

## Evidencia

Pendiente. La implementacion debe comenzar solamente despues de completar `PAYMENTS-07`.

## Mensaje de commit propuesto

Se definira unicamente despues de superar la barrera de validacion.
