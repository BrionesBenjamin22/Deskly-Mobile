# Conversaciones con IA — Entrega 2

proyecto: `Deskly-Mobile`
formato: `Markdown`
alcance_acumulado: `Entregas 1 y 2`
periodo_acumulado: `2026-04-29 a 2026-06-24`

## Índice de temas

1. [Criterio acumulativo](#1-criterio-acumulativo)
2. [Entrega 1 — Base, escritorios y reservas](#2-entrega-1--base-escritorios-y-reservas)
3. [Entrega 1 — Bugs, decisiones y validación](#3-entrega-1--bugs-decisiones-y-validación)
4. [Entrega 2 — Autenticación](#4-entrega-2--autenticación)
5. [Entrega 2 — Miembros y reservas](#5-entrega-2--miembros-y-reservas)
6. [Entrega 2 — Gestores y penalizaciones](#6-entrega-2--gestores-y-penalizaciones)
7. [Entrega 2 — Administración de usuarios](#7-entrega-2--administración-de-usuarios)
8. [Entrega 2 — Errores de login](#8-entrega-2--errores-de-login)
9. [Entrega 2 — Cambio de contraseña](#9-entrega-2--cambio-de-contraseña)
10. [Entrega 2 — Navegación y UX](#10-entrega-2--navegación-y-ux)
11. [Bugs y revisiones](#11-bugs-y-revisiones)
12. [Infraestructura y documentación](#12-infraestructura-y-documentación)
13. [Pendientes transferidos](#13-pendientes-transferidos)
14. [Skills y capacidades](#14-skills-y-capacidades)

## 1. Criterio acumulativo

Este archivo contiene lo realizado en la Entrega 1 y agrega las conversaciones
de la Entrega 2. Es autosuficiente: no requiere abrir el archivo de la entrega
anterior para comprender las decisiones heredadas.

Los prompts literales preservados se identifican como `prompt_registrado`; los
derivados de tareas, commits y documentación como `prompt_reconstruido`.

## 2. Entrega 1 — Base, escritorios y reservas

### Arquitectura y datos

prompt_reconstruido:

> Inicializar Deskly con NestJS, Expo, Prisma y PostgreSQL siguiendo una
> separación hexagonal y validando cada bloque.

resultado:

- estructura backend/mobile;
- configuración Prisma y PostgreSQL;
- cliente `@prisma/client`;
- variables de entorno;
- migraciones;
- TDD-0001 a TDD-0005.

### Escritorios

- CRUD paginado de a 9;
- baja lógica;
- disponibilidad por fecha y horario;
- exclusión de reservas solapadas;
- zonas `A/B/C`;
- descripciones reutilizables;
- amenities many-to-many;
- CRUD de catálogos;
- `409` al eliminar un catálogo asociado.

### Reservas

prompt_registrado:

> En esta entrega no debo contemplar los usuarios. Así que implementa lo
> necesario sin tener en cuenta los usuarios o las relaciones con los mismos.

resultado:

- reserva sin miembro durante la primera entrega;
- alta, listado, detalle, edición y cancelación;
- exclusión PostgreSQL contra solapamientos;
- `404`, `409` y `400` diferenciados;
- confirmación backend con nombre del escritorio.

### Revisiones TDD

prompts_registrados:

> Está cubierto por el CRUD implementado, verifica igualmente.

> En el TDD-0004-cancelación-reserva.md también está cubierto con lo actual.
> Verifícalo.

> Finalmente, comprueba el TDD-0005-confirmación-visual-reserva.md.

resultado:

- visualización y cancelación verificadas para el alcance sin usuarios;
- `/reservations/me` y privacidad transferidos a Entrega 2;
- respuesta preparada para confirmación visual mobile.

### Ampliación del escritorio

prompt_registrado:

> Agregar descripción reutilizable, zona enumerativa A/B/C y Amenities.

revisión_registrada:

> No crear la migración manual; borrar los datos incompatibles y generarla
> correctamente.

resultado:

- schema, dominio, API, persistencia y documentación actualizados;
- migración generada por Prisma.

## 3. Entrega 1 — Bugs, decisiones y validación

bugs_resueltos:

1. `.env` no leído por Prisma.
2. `import.meta.url` incompatible con Nest.
3. autenticación PostgreSQL fallida.
4. base inicial inexistente.
5. cliente Prisma incompatible con runtime.
6. `start:prod` con ruta incorrecta.
7. usuarios incluidos fuera del alcance.
8. confirmación sin datos suficientes.

documentación:

- README general y por módulos;
- TDDs;
- bitácora de conversación del MVP;
- registro raíz de conversaciones.

validación:

- lint, build, tests y migraciones aprobados;
- evidencia histórica: 6 suites, 27 pruebas y 4 migraciones.

## 4. Entrega 2 — Autenticación

tipo: `feature + seguridad`

prompt_reconstruido:

> Incorporar autenticación JWT, registro, login y perfil, protegiendo los
> endpoints por rol y manteniendo el contrato mobile alineado.

implementación_backend:

- registro y login;
- `/auth/me`;
- actualización de perfil;
- hash de contraseña;
- JWT;
- guards de autenticación y roles;
- autorización `ADMIN`, `GESTOR` y `MIEMBRO`.

implementación_mobile:

- pantalla de autenticación;
- registro;
- login;
- perfil;
- gestión de sesión en el ciclo de la aplicación;
- feedback visible de error y éxito.

## 5. Entrega 2 — Miembros y reservas

tipo: `feature + corrección`

solicitud:

- incorporar miembros al dominio;
- asociar cada reserva a su propietario;
- limitar a miembros a sus propios datos.

respuesta:

- entidad y persistencia de miembro;
- asociación con usuario;
- `memberId` reintroducido bajo autenticación;
- listado filtrado para `MIEMBRO`;
- permisos ampliados para roles operativos.

bug:

- algunas reservas no quedaban vinculadas al miembro autenticado.

corrección:

- se alinearon controller, caso de uso, repositorio y contrato.

## 6. Entrega 2 — Gestores y penalizaciones

tipo: `feature operativa`

solicitud:

- permitir al gestor verificar llegada y registrar ausencia;
- aplicar penalizaciones y bloqueos.

respuesta:

- check-in exclusivo de gestor;
- filtro operativo por fecha;
- registro de ausencia;
- penalización activa;
- bloqueo temporal;
- consulta de penalizaciones propias y de terceros según rol.

decisiones:

- `ADMIN` no ejecuta check-in;
- `MIEMBRO` solo opera sus reservas;
- el bloqueo se expresa con fecha de desbloqueo.

## 7. Entrega 2 — Administración de usuarios

tipo: `feature`

implementación:

- listado paginado y búsqueda;
- cambio de rol;
- restauración de acceso;
- desbloqueo;
- reactivación;
- baja lógica.

permisos:

- endpoints reservados a `ADMIN`;
- acciones ocultas en mobile para otros roles.

## 8. Entrega 2 — Errores de login

tipo: `revisión UX + contrato`

solicitud:

- diferenciar todos los casos rechazados por autenticación;
- no mostrar un único mensaje genérico para HTTP `401`.

contrato:

- credenciales incorrectas: `401`;
- cuenta desactivada: `401` y `ACCOUNT_INACTIVE`;
- cuenta bloqueada: `401` y `blockedUntil`.

mobile:

- título genérico para credenciales;
- `Cuenta desactivada`;
- `Cuenta bloqueada`;
- `StatusModal` accionable.

revisión_técnica:

- las clases custom que extienden `Error` incluyen
  `Object.setPrototypeOf(this, Clase.prototype)`;
- los `catch` verifican `instanceof` y `error.name`.

## 9. Entrega 2 — Cambio de contraseña

tipo: `feature + seguridad`

backend:

- `PATCH /auth/me/password`;
- contraseña actual obligatoria;
- nueva contraseña de 8 a 72 caracteres;
- al menos una mayúscula y un número;
- hash nuevo;
- errores `401` y `404` seguros.

mobile:

- `ChangePasswordModal`;
- validación en tiempo real;
- confirmación de coincidencia;
- acceso desde `BottomTabBar`;
- callbacks propagados desde `App.tsx`.

## 10. Entrega 2 — Navegación y UX

decisiones:

- navegación basada en `currentScreen`;
- sin React Navigation;
- token y sesión por props;
- modales globales en `App.tsx`;
- componentes de fecha reutilizados entre features;
- formularios con feedback visible;
- perfiles editables para gestor y miembro;
- perfil ADMIN de solo lectura.

## 11. Bugs y revisiones

1. Teléfonos extensos rechazados durante el registro.
2. Reserva no vinculada al usuario autenticado.
3. Fechas de pago enviadas con formatos diferentes.
4. Navegación autenticada inestable después de integrar ramas.
5. Todos los `401` tratados como credenciales incorrectas.
6. Errores custom quebrados por la transpilación de Babel.
7. Cuenta bloqueada sin restauración administrativa.
8. Cambio de contraseña sin acceso uniforme desde todas las pantallas.

resultado:

- contratos backend/mobile alineados;
- flujos por rol estabilizados;
- feedback específico implementado.

## 12. Infraestructura y documentación

- Docker multi-stage incorporado;
- compatibilidad con PostgreSQL, Prisma y Expo preservada;
- README de auth, reservations, penalties y users actualizado;
- `AGENTS.md` actualizado con navegación, errores, endpoints y permisos;
- cierre integrado a `dev` y luego a la rama de entrega.

## 13. Pendientes transferidos

- localidades y áreas de trabajo;
- mapas y ubicación de reservas;
- pago real previo a confirmación;
- webhooks e idempotencia;
- persistencia segura de sesión;
- seguridad de dependencias y CI;
- panel administrativo de catálogos;
- conectividad Expo y despliegue.

## 14. Skills y capacidades

skills_formales:

- no existe evidencia persistida de una skill empaquetada utilizada durante las
  entregas 1 y 2.

capacidades_acumuladas:

- análisis de requisitos y TDD;
- arquitectura modular y hexagonal;
- NestJS, Prisma y PostgreSQL;
- React Native y Expo;
- autenticación JWT;
- autorización por rol y propiedad;
- testing;
- UX y documentación.
