# Changelog de Deskly

## Proposito y criterio de trazabilidad

Este documento registra las entregas funcionales de Deskly por separado. Resume
el objetivo de cada entrega, las funcionalidades desarrolladas, las decisiones
t?cnicas, los errores corregidos, las validaciones ejecutadas y los pendientes
conocidos.

Las fuentes utilizadas para reconstruirlo son:

- historial de Git y ramas `entrega-1`, `entrega-2`, `dev` y `main`;
- TDDs funcionales del directorio `docs/TDDs`;
- registro can?nico de `/tasks`;
- documentaci?n t?cnica de `backend` y `mobile`;
- bit?coras `CONVERSACIONES.md` y
  `docs/conversacion-agente-implementacion-mvp.md`;
- PR #8, titulado
  `feat: Consolidar aplicaci?n con mejoras acordes a la entrega 3`;
- comentarios y aprobaciones de revisi?n disponibles en GitHub.

No se presenta como completada una tarea que el registro can?nico mantenga
pendiente o en progreso. Las cantidades de pruebas corresponden a la evidencia
registrada al cierre de cada bloque y pueden variar entre etapas por la
incorporaci?n posterior de nuevas suites.

---

## Entrega 1 ? MVP de escritorios y reservas

### Periodo y alcance

- Periodo principal: 29 de abril al 4 de junio de 2026.
- Rama de entrega: `entrega-1`.
- Integraci?n: PR #2.
- Objetivo: establecer la base t?cnica del producto y entregar un flujo
  funcional de consulta, reserva y administraci?n inicial de escritorios.

### Base del proyecto

- Se inicializ? la aplicaci?n Deskly con backend NestJS, aplicaci?n Expo/React
  Native y base PostgreSQL.
- Se configur? Prisma, generaci?n del cliente, migraciones y scripts de
  ejecuci?n.
- Se adopt? una arquitectura modular con separaci?n de dominio, aplicaci?n,
  infraestructura e interfaces.
- Se document? el MVP mediante los TDD-0001 a TDD-0005.
- Se incorpor? soporte de ejecuci?n web en Expo.

### Escritorios

- CRUD de escritorios con listado paginado, detalle, edici?n y baja l?gica.
- Consulta de disponibilidad por fecha y franja horaria.
- Exclusi?n de escritorios deshabilitados o eliminados.
- Modelo ampliado con:
  - zonas `A`, `B` y `C`;
  - descripciones reutilizables;
  - capacidad de personas;
  - amenities reutilizables;
  - relaci?n muchos-a-muchos entre escritorios y amenities.
- CRUD de descripciones y amenities.
- Protecci?n de eliminaci?n para cat?logos asociados a escritorios.
- Formularios mobile con validaciones, feedback y visualizaci?n del cat?logo.

### Reservas

- Alta, listado, detalle, edici?n y cancelaci?n l?gica de reservas.
- Prevenci?n de solapamientos activos mediante una restricci?n de PostgreSQL.
- Estados iniciales de reserva y liberaci?n de disponibilidad al cancelar.
- Respuesta de alta preparada para mostrar una confirmaci?n visual.
- Pantalla `Mis reservas`, inicialmente desarrollada con datos de prueba y luego
  conectada al backend.
- Confirmaci?n visible de operaciones y manejo de conflictos de disponibilidad.

### Decisiones y correcciones relevantes

- En esta entrega se excluy? intencionalmente la relaci?n con usuarios.
- `DELETE` no elimina f?sicamente escritorios ni reservas.
- Se corrigi? la carga de variables de entorno de Prisma.
- Se reemplaz? el cliente Prisma generado localmente por `@prisma/client` para
  resolver incompatibilidades de m?dulos.
- Se aline? `start:prod` con la salida real `dist/src/main`.
- La migraci?n de zona, descripci?n y amenities fue generada por Prisma despu?s
  de limpiar los datos incompatibles; no se escribi? manualmente.
- Se estabiliz? el contrato de conflicto con HTTP `409`.

### Validaci?n registrada

- Build, lint, tests unitarios y estado de migraciones aprobados.
- Cierre hist?rico documentado: 6 suites, 27 pruebas y 4 migraciones.
- Se realizaron comprobaciones manuales del CRUD, disponibilidad, reserva,
  cancelaci?n y respuesta posterior a una baja l?gica.

### Pendientes transferidos a la Entrega 2

- Autenticaci?n y autorizaci?n.
- Asociaci?n de reservas con miembros.
- Privacidad por propietario.
- Gesti?n de usuarios y roles.
- Flujo operativo de gestores.
- Penalizaciones.

---

## Skills utilizadas hasta esta entrega

No existe evidencia persistida de una skill formal empaquetada. Se aplicaron an?lisis de TDD, arquitectura hexagonal, NestJS, Prisma, PostgreSQL, React Native, Expo, testing y documentaci?n.
