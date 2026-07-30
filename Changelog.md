# Changelog de Deskly

## Proposito y criterio de trazabilidad

Este documento registra las entregas funcionales de Deskly por separado. Resume
el objetivo de cada entrega, las funcionalidades desarrolladas, las decisiones
técnicas, los errores corregidos, las validaciones ejecutadas y los pendientes
conocidos.

Las fuentes utilizadas para reconstruirlo son:

- historial de Git y ramas `entrega-1`, `entrega-2`, `dev` y `main`;
- TDDs funcionales del directorio `docs/TDDs`;
- registro canónico de `/tasks`;
- documentación técnica de `backend` y `mobile`;
- bitácoras `CONVERSACIONES.md` y
  `docs/conversacion-agente-implementacion-mvp.md`;
- PR #8, titulado
  `feat: Consolidar aplicación con mejoras acordes a la entrega 3`;
- comentarios y aprobaciones de revisión disponibles en GitHub.

No se presenta como completada una tarea que el registro canónico mantenga
pendiente o en progreso. Las cantidades de pruebas corresponden a la evidencia
registrada al cierre de cada bloque y pueden variar entre etapas por la
incorporación posterior de nuevas suites.

---

## Entrega 1 — MVP de escritorios y reservas

### Periodo y alcance

- Periodo principal: 29 de abril al 4 de junio de 2026.
- Rama de entrega: `entrega-1`.
- Integración: PR #2.
- Objetivo: establecer la base técnica del producto y entregar un flujo
  funcional de consulta, reserva y administración inicial de escritorios.

### Base del proyecto

- Se inicializó la aplicación Deskly con backend NestJS, aplicación Expo/React
  Native y base PostgreSQL.
- Se configuró Prisma, generación del cliente, migraciones y scripts de
  ejecución.
- Se adoptó una arquitectura modular con separación de dominio, aplicación,
  infraestructura e interfaces.
- Se documentó el MVP mediante los TDD-0001 a TDD-0005.
- Se incorporó soporte de ejecución web en Expo.

### Escritorios

- CRUD de escritorios con listado paginado, detalle, edición y baja lógica.
- Consulta de disponibilidad por fecha y franja horaria.
- Exclusión de escritorios deshabilitados o eliminados.
- Modelo ampliado con:
  - zonas `A`, `B` y `C`;
  - descripciones reutilizables;
  - capacidad de personas;
  - amenities reutilizables;
  - relación muchos-a-muchos entre escritorios y amenities.
- CRUD de descripciones y amenities.
- Protección de eliminación para catálogos asociados a escritorios.
- Formularios mobile con validaciones, feedback y visualización del catálogo.

### Reservas

- Alta, listado, detalle, edición y cancelación lógica de reservas.
- Prevención de solapamientos activos mediante una restricción de PostgreSQL.
- Estados iniciales de reserva y liberación de disponibilidad al cancelar.
- Respuesta de alta preparada para mostrar una confirmación visual.
- Pantalla `Mis reservas`, inicialmente desarrollada con datos de prueba y luego
  conectada al backend.
- Confirmación visible de operaciones y manejo de conflictos de disponibilidad.

### Decisiones y correcciones relevantes

- En esta entrega se excluyó intencionalmente la relación con usuarios.
- `DELETE` no elimina físicamente escritorios ni reservas.
- Se corrigió la carga de variables de entorno de Prisma.
- Se reemplazó el cliente Prisma generado localmente por `@prisma/client` para
  resolver incompatibilidades de módulos.
- Se alineó `start:prod` con la salida real `dist/src/main`.
- La migración de zona, descripción y amenities fue generada por Prisma después
  de limpiar los datos incompatibles; no se escribió manualmente.
- Se estabilizó el contrato de conflicto con HTTP `409`.

### Validación registrada

- Build, lint, tests unitarios y estado de migraciones aprobados.
- Cierre histórico documentado: 6 suites, 27 pruebas y 4 migraciones.
- Se realizaron comprobaciones manuales del CRUD, disponibilidad, reserva,
  cancelación y respuesta posterior a una baja lógica.

### Pendientes transferidos a la Entrega 2

- Autenticación y autorización.
- Asociación de reservas con miembros.
- Privacidad por propietario.
- Gestión de usuarios y roles.
- Flujo operativo de gestores.
- Penalizaciones.

---


## Skills utilizadas

### Skills formales de agente verificables

- `github:github`: utilizada para consultar los metadatos, la discusión y las
  aprobaciones del PR #8 y contrastar la revisión de la Entrega 3.

No existe evidencia persistida que permita afirmar que otras skills empaquetadas
de Codex se utilizaron en conversaciones históricas. Por trazabilidad, no se
atribuyen skills formales no verificables.

### Capacidades técnicas aplicadas durante el proyecto

Estas capacidades se desprenden de los cambios, tareas y validaciones:

- análisis de requisitos y TDD;
- arquitectura modular y hexagonal;
- NestJS, TypeScript, Prisma y PostgreSQL;
- React Native, Expo y testing de componentes;
- modelado de dominio y contratos HTTP;
- autenticación JWT y autorización por roles;
- seguridad de aplicaciones y revisión de dependencias;
- idempotencia, concurrencia y consistencia transaccional;
- integración con Mercado Pago y gateways fake;
- webhooks, HMAC, anti-replay y conciliación;
- Docker, Docker Compose y hardening de contenedores;
- GitHub Actions y estabilización de CI;
- UX accesible, responsive y orientada a prevención de errores;
- documentación técnica, bitácoras y gestión canónica de tareas.
