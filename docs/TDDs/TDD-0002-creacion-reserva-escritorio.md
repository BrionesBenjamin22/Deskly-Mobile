---
id: TDD-0002
estado: Propuesto
autor: Equipo Deskly
fecha: 2026-05-20
titulo: Creación de reserva de escritorio
modulo: Reservas
entrega: Entrega 1 - MVP
---

# TDD-0002: Creación de reserva de escritorio

## 1. Contexto de negocio

### 1.1 Problema

Una vez que el miembro encuentra un escritorio disponible, necesita asegurar su uso para una fecha y horario determinados. Sin un mecanismo de reserva, la disponibilidad consultada no garantiza que el espacio siga disponible al momento de asistir al coworking.

### 1.2 Objetivo

Permitir que un miembro reserve un escritorio específico para una fecha y franja horaria determinada, evitando conflictos de disponibilidad y reservas duplicadas.

### 1.3 User Persona

- **Actor principal:** Miembro.
- **Necesidad:** Confirmar un espacio de trabajo desde la aplicación móvil.
- **Problemática actual:** No tener garantía de que el escritorio elegido siga disponible al llegar al coworking.

---

## 2. Alcance funcional

### 2.1 Incluido

- Crear una reserva sobre un escritorio disponible.
- Asociar la reserva al miembro que realiza la operación.
- Validar que el escritorio exista.
- Validar que la fecha y el rango horario sean correctos.
- Validar disponibilidad antes de confirmar la reserva.
- Persistir la reserva con estado activo.
- Evitar reservas superpuestas para el mismo escritorio.
- Gestión de múltiples sedes o edificios. <!-- Incluido, pero en la próxima entrega -->

### 2.2 No incluido

- Pagos o señas por reserva.
- Penalizaciones por cancelación.
- Reservas recurrentes.
- Check-in presencial del miembro.
- Administración manual de reservas por parte de un administrador.

---

## 3. User Story asociada

**Como** Miembro  
**quiero** seleccionar un escritorio en un horario y fecha específicos  
**para** reservar mi lugar de trabajo.

---

## 4. Criterios de aceptación

### CA-01: Reserva exitosa

**Dado** un escritorio disponible para una fecha y rango horario determinados  
**cuando** el miembro confirma la reserva  
**entonces** el sistema crea una reserva activa y la vincula al miembro que realizó la operación.

### CA-02: Escritorio no disponible

**Dado** un escritorio que ya posee una reserva activa superpuesta para el mismo período  
**cuando** el miembro intenta confirmar la reserva  
**entonces** el sistema rechaza la operación e informa que el escritorio ya no está disponible.

### CA-03: Escritorio inexistente

**Dado** un identificador de escritorio inexistente  
**cuando** el miembro intenta realizar la reserva  
**entonces** el sistema rechaza la operación e informa que el escritorio no fue encontrado.

### CA-04: Rango horario inválido

**Dado** una solicitud donde el horario de fin es menor o igual al horario de inicio  
**cuando** el miembro intenta realizar la reserva  
**entonces** el sistema rechaza la operación por rango horario inválido.

### CA-05: Datos obligatorios ausentes

**Dado** una solicitud sin escritorio, fecha, horario de inicio u horario de fin  
**cuando** el miembro intenta realizar la reserva  
**entonces** el sistema rechaza la operación indicando que existen datos obligatorios faltantes.

---

## 5. Reglas de negocio

- **RN-01:** Solo se puede reservar un escritorio existente y habilitado.
- **RN-02:** Solo se puede reservar un escritorio disponible para el período solicitado.
- **RN-03:** Una reserva activa bloquea el escritorio para el rango horario correspondiente.
- **RN-04:** No pueden existir dos reservas activas superpuestas para el mismo escritorio.
- **RN-05:** Las reservas canceladas no bloquean disponibilidad.
- **RN-06:** La reserva debe quedar asociada al miembro autenticado que la creó.
- **RN-07:** La fecha, el horario de inicio y el horario de fin son obligatorios.
- **RN-08:** El horario de fin debe ser posterior al horario de inicio.
- **RN-09:** La creación de la reserva debe ejecutarse de forma atómica para evitar conflictos de concurrencia.

---

## 6. Modelo de dominio involucrado

### 6.1 Entidades principales

- `Reservation`
- `Desk`
- `Member`

### 6.2 Value Objects sugeridos

- `ReservationPeriod`
- `TimeSlot`
- `ReservationStatus`

### 6.3 Estados relevantes

- `ACTIVE`
- `CANCELLED`

### 6.4 Invariante principal

No debe existir más de una reserva activa para el mismo escritorio con períodos horarios superpuestos.

Ejemplo de superposición:

```txt
Reserva existente: 09:00 - 13:00
Nueva solicitud:   12:00 - 15:00
Resultado: conflicto de disponibilidad
```

---

## 7. Contratos de aplicación

### 7.1 Caso de uso principal

```ts
CreateReservationUseCase.execute(
  input: CreateReservationInput,
): Promise<CreateReservationOutput>
```

### 7.2 Input DTO

```ts
type CreateReservationInput = {
  memberId: string;
  deskId: string;
  date: string;
  startTime: string;
  endTime: string;
};
```

### 7.3 Output DTO

```ts
type CreateReservationOutput = {
  reservationId: string;
  deskId: string;
  deskCode: string;
  memberId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE";
};
```

---

## 8. Diseño técnico propuesto

### 8.1 Arquitectura

La función se implementará siguiendo arquitectura hexagonal:

- **Dominio:** entidad `Reservation`, reglas de disponibilidad y validación de períodos.
- **Aplicación:** caso de uso `CreateReservationUseCase`.
- **Infraestructura:** repositorios concretos con PostgreSQL y control de conflictos.
- **Presentación:** controller HTTP en NestJS, validación de entrada y documentación Swagger.

### 8.2 Puertos requeridos

```ts
interface DeskRepositoryPort {
  findById(deskId: string): Promise<Desk | null>;
}
```

```ts
interface ReservationRepositoryPort {
  existsOverlappingReservation(params: {
    deskId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<boolean>;

  save(reservation: Reservation): Promise<Reservation>;
}
```

### 8.3 Adaptadores requeridos

- `PostgresDeskRepository`
- `PostgresReservationRepository`
- `ReservationsController`

---

## 9. API propuesta

### 9.1 Endpoint

```http
POST /reservations
```

### 9.2 Request

```json
{
  "deskId": "desk_001",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00"
}
```

> Nota: `memberId` no debería recibirse desde el body. Debe obtenerse desde el usuario autenticado.

### 9.3 Response exitosa

```json
{
  "reservationId": "res_001",
  "deskId": "desk_001",
  "deskCode": "D-01",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00",
  "status": "ACTIVE"
}
```

### 9.4 Errores esperados

| Código | Motivo | Descripción |
|---|---|---|
| 400 | Invalid input | Datos inválidos o faltantes |
| 400 | Invalid time range | El horario de fin debe ser posterior al horario de inicio |
| 401 | Unauthorized | El miembro no está autenticado |
| 404 | Desk not found | El escritorio no existe |
| 409 | Desk unavailable | El escritorio ya no está disponible para el período solicitado |

---

## 10. Validaciones

- `deskId` es obligatorio.
- `date` es obligatoria y debe tener formato válido.
- `startTime` es obligatorio y debe tener formato válido.
- `endTime` es obligatorio y debe tener formato válido.
- `endTime` debe ser posterior a `startTime`.
- El escritorio debe existir.
- El escritorio debe estar habilitado para reservas.
- No debe existir una reserva activa superpuesta para el mismo escritorio.

---

## 11. Pruebas esperadas

### 11.1 Unitarias

- Crea una reserva válida cuando el escritorio está disponible.
- Rechaza una reserva sobre un escritorio ocupado.
- Rechaza una reserva con rango horario inválido.
- Rechaza una reserva sobre un escritorio inexistente.
- Asocia correctamente la reserva al miembro autenticado.
- Ignora reservas canceladas al validar disponibilidad.

### 11.2 Integración

- Persiste la reserva en PostgreSQL.
- Devuelve error `409 Conflict` cuando existe superposición.
- Devuelve error `404 Not Found` cuando el escritorio no existe.
- El endpoint obtiene el miembro desde la autenticación y no desde el body.

### 11.3 E2E / Mobile

- Flujo exitoso: consultar disponibilidad, seleccionar escritorio y confirmar reserva.
- Flujo con conflicto: intentar reservar un escritorio ocupado y visualizar mensaje claro.
- Flujo inválido: enviar datos incompletos y visualizar error de validación.

---

## 12. Consideraciones no funcionales

- **Rendimiento:** la creación de reserva debe validar disponibilidad en tiempo aceptable para uso mobile.
- **Conectividad:** la operación requiere conexión a internet para evitar duplicados y mantener sincronización.
- **Consistencia:** la operación debe evitar condiciones de carrera ante reservas simultáneas.
- **Seguridad:** solo miembros autenticados pueden crear reservas.
- **Usabilidad:** el resultado debe mostrarse en español y de forma clara.
- **Accesibilidad:** los mensajes visuales deben cumplir contraste mínimo WCAG AA.

---

## 13. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| No guardar el estado reservado directamente en `Desk` | La disponibilidad depende de fecha y horario, por lo tanto debe calcularse a partir de reservas activas. |
| Obtener `memberId` desde autenticación | Evita que un usuario cree reservas en nombre de otro miembro. |
| Usar error `409 Conflict` para disponibilidad | Representa correctamente un conflicto de estado del recurso. |
| Validar superposición en backend | La app mobile no puede ser fuente confiable para disponibilidad final. |
| Ejecutar la creación de forma atómica | Reduce el riesgo de reservas duplicadas ante concurrencia. |

---

## 14. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Dos miembros intentan reservar el mismo escritorio al mismo tiempo | Alto | Validar disponibilidad en backend dentro de una operación transaccional. |
| La app muestra disponibilidad desactualizada | Medio | Revalidar disponibilidad al confirmar la reserva. |
| El miembro manipula el `memberId` enviado | Alto | No aceptar `memberId` desde el body; obtenerlo desde el token. |
| Error de modelado al marcar `Desk` como reservado | Medio | Modelar disponibilidad a partir de `Reservation`. |

---

## 15. Criterio de finalización

La función se considera terminada cuando:

- [ ] El miembro puede crear una reserva desde la app mobile.
- [ ] Se valida disponibilidad antes de guardar.
- [ ] La reserva queda asociada al miembro autenticado.
- [ ] La reserva queda persistida con estado `ACTIVE`.
- [ ] El endpoint está documentado en Swagger.
- [ ] Se manejan errores de datos inválidos, escritorio inexistente y conflicto de disponibilidad.
- [ ] Existen pruebas unitarias del caso de uso.
- [ ] Existen pruebas de integración del endpoint.
- [ ] La operación evita reservas superpuestas.
