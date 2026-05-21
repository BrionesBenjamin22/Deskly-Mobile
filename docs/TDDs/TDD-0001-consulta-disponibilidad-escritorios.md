---
id: TDD-0001
estado: Propuesto
autor: Equipo Deskly
fecha: 2026-05-20
titulo: Consulta de disponibilidad de escritorios
modulo: Reservas
entrega: Entrega 1 - MVP
---

# TDD-0001: Consulta de disponibilidad de escritorios

## 1. Contexto de negocio

### 1.1 Problema

Los miembros necesitan conocer qué escritorios se encuentran disponibles antes de trasladarse a un espacio de coworking. Sin esta información, existe incertidumbre sobre la disponibilidad real del lugar y el usuario puede llegar al establecimiento sin tener garantizado un espacio de trabajo.

### 1.2 Objetivo

Permitir que un miembro consulte desde la aplicación móvil la disponibilidad de escritorios para una fecha y una franja horaria determinada, mostrando únicamente aquellos escritorios que puedan ser reservados en ese período.

### 1.3 User Persona

- **Actor principal:** Miembro.
- **Perfil:** Profesional independiente, freelancer, estudiante universitario o trabajador remoto.
- **Necesidad:** Consultar espacios disponibles de manera rápida desde un dispositivo móvil.
- **Problemática actual:** No tener certeza sobre la disponibilidad de escritorios antes de llegar al coworking.

---

## 2. Alcance funcional

### 2.1 Incluido

- Consultar escritorios disponibles por fecha.
- Consultar escritorios disponibles por horario de inicio y horario de fin.
- Excluir escritorios que ya tengan reservas activas superpuestas con el período solicitado.
- Devolver una lista de escritorios disponibles con información mínima para que el usuario pueda seleccionar uno.
- Informar claramente cuando no existan escritorios disponibles para el período indicado.

### 2.2 No incluido

- Gestión de múltiples edificios o sedes.
- Gestión de salas de reuniones.
- Reservas recurrentes.
- Recomendaciones automáticas de escritorios.
- Administración de escritorios desde la aplicación móvil.
- Consulta offline de disponibilidad.

---

## 3. User Story asociada

**Como** Miembro  
**quiero** acceder a una lista de escritorios disponibles en una fecha y horario específicos  
**para** garantizar que existe un espacio de trabajo disponible en ese momento.

---

## 4. Criterios de aceptación

### CA-01: Consulta exitosa con escritorios disponibles

**Dado** que el miembro selecciona una fecha, un horario de inicio y un horario de fin válidos  
**cuando** consulta la disponibilidad  
**entonces** el sistema muestra únicamente los escritorios que no poseen reservas activas superpuestas en ese período.

### CA-02: Consulta sin escritorios disponibles

**Dado** que todos los escritorios se encuentran reservados para el período solicitado  
**cuando** el miembro consulta la disponibilidad  
**entonces** el sistema informa claramente que no hay escritorios disponibles para la fecha y horario seleccionados.

### CA-03: Consulta con rango horario inválido

**Dado** que el miembro ingresa un horario de fin menor o igual al horario de inicio  
**cuando** intenta consultar la disponibilidad  
**entonces** el sistema rechaza la consulta e informa que el rango horario es inválido.

### CA-04: Consulta con datos incompletos

**Dado** que el miembro no informa la fecha, el horario de inicio o el horario de fin  
**cuando** intenta consultar la disponibilidad  
**entonces** el sistema rechaza la solicitud e informa qué datos son obligatorios.

---

## 5. Reglas de negocio

- **RN-01:** Un escritorio se considera disponible si no posee reservas activas superpuestas con el período solicitado.
- **RN-02:** La fecha, el horario de inicio y el horario de fin son obligatorios para consultar disponibilidad.
- **RN-03:** El horario de fin debe ser posterior al horario de inicio.
- **RN-04:** Las reservas canceladas no bloquean la disponibilidad de un escritorio.
- **RN-05:** Solo deben mostrarse escritorios habilitados para reserva.
- **RN-06:** La consulta de disponibilidad debe responder en menos de 2 segundos bajo condiciones normales de operación.
- **RN-07:** La disponibilidad debe calcularse en el backend para evitar inconsistencias entre usuarios.

---

## 6. Modelo de dominio involucrado

### 6.1 Entidades principales

#### Desk

Representa un escritorio físico disponible para ser reservado dentro del coworking.

Atributos sugeridos:

```ts
class Desk {
  id: string;
  code: string;
  name?: string;
  locationDescription?: string;
  enabled: boolean;
}
```

#### Reservation

Representa la reserva de un escritorio realizada por un miembro para una fecha y franja horaria determinada.

Atributos sugeridos:

```ts
class Reservation {
  id: string;
  deskId: string;
  memberId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}
```

### 6.2 Value Objects sugeridos

#### TimeSlot

Representa el rango horario solicitado por el miembro.

```ts
class TimeSlot {
  startTime: string;
  endTime: string;

  overlaps(other: TimeSlot): boolean {
    // Implementación de dominio
  }
}
```

#### ReservationDate

Representa la fecha en la que se desea consultar disponibilidad.

```ts
class ReservationDate {
  value: string;
}
```

### 6.3 Estados relevantes

```ts
enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}
```

---

## 7. Contratos de aplicación

### 7.1 Caso de uso principal

```ts
GetAvailableDesksUseCase.execute(
  input: GetAvailableDesksInput,
): Promise<GetAvailableDesksOutput>
```

### 7.2 Input DTO

```ts
type GetAvailableDesksInput = {
  date: string;
  startTime: string;
  endTime: string;
};
```

### 7.3 Output DTO

```ts
type GetAvailableDesksOutput = {
  desks: {
    id: string;
    code: string;
    name?: string;
    locationDescription?: string;
  }[];
};
```

---

## 8. Diseño técnico propuesto

### 8.1 Enfoque arquitectónico

La función se implementará siguiendo arquitectura hexagonal, separando la lógica de negocio de los detalles técnicos de infraestructura.

- **Dominio:** reglas de disponibilidad, entidades y value objects.
- **Aplicación:** caso de uso `GetAvailableDesksUseCase`.
- **Infraestructura:** implementación del repositorio usando PostgreSQL.
- **Presentación:** controller HTTP en NestJS y documentación Swagger.
- **Mobile:** pantalla o flujo de consulta de disponibilidad en React Native / Expo.

### 8.2 Flujo esperado

1. El miembro selecciona fecha, horario de inicio y horario de fin desde la app mobile.
2. La app realiza una solicitud al backend consultando disponibilidad.
3. El backend valida los parámetros recibidos.
4. El caso de uso solicita al repositorio los escritorios disponibles.
5. El repositorio excluye escritorios con reservas activas superpuestas.
6. El backend devuelve la lista de escritorios disponibles.
7. La app muestra los escritorios disponibles o un estado vacío si no hay resultados.

### 8.3 Puertos requeridos

```ts
interface DeskRepositoryPort {
  findAvailableByTimeSlot(params: {
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<Desk[]>;
}
```

### 8.4 Adaptadores requeridos

- `PostgresDeskRepository`: implementación del puerto `DeskRepositoryPort`.
- `DeskAvailabilityController`: controller HTTP encargado de recibir la consulta.
- `GetAvailableDesksUseCase`: caso de uso de aplicación.

---

## 9. API propuesta

### 9.1 Endpoint

```http
GET /desks/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
```

### 9.2 Ejemplo de request

```http
GET /desks/availability?date=2026-06-01&startTime=09:00&endTime=13:00
```

### 9.3 Response exitosa

```json
{
  "desks": [
    {
      "id": "desk_001",
      "code": "D-01",
      "name": "Escritorio 1",
      "locationDescription": "Sector principal"
    },
    {
      "id": "desk_002",
      "code": "D-02",
      "name": "Escritorio 2",
      "locationDescription": "Sector principal"
    }
  ]
}
```

### 9.4 Response sin resultados

```json
{
  "desks": []
}
```

### 9.5 Errores esperados

| Código | Motivo | Descripción |
|---|---|---|
| 400 | Missing required params | Faltan parámetros obligatorios. |
| 400 | Invalid date format | La fecha no tiene un formato válido. |
| 400 | Invalid time range | El horario de fin debe ser posterior al horario de inicio. |
| 500 | Internal server error | Error inesperado del servidor. |

---

## 10. Validaciones

### 10.1 Validaciones de entrada

- `date` es obligatorio.
- `date` debe tener formato `YYYY-MM-DD`.
- `startTime` es obligatorio.
- `startTime` debe tener formato `HH:mm`.
- `endTime` es obligatorio.
- `endTime` debe tener formato `HH:mm`.
- `endTime` debe ser posterior a `startTime`.

### 10.2 Validaciones de dominio

- El rango horario debe ser válido.
- Solo deben considerarse reservas activas para bloquear disponibilidad.
- Las reservas canceladas deben ignorarse para el cálculo de disponibilidad.
- Solo deben considerarse escritorios habilitados.

---

## 11. Consideraciones de persistencia

### 11.1 Tablas sugeridas

#### desks

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid | Identificador único del escritorio. |
| code | varchar | Código visible del escritorio. |
| name | varchar | Nombre opcional del escritorio. |
| location_description | varchar | Ubicación o descripción del sector. |
| enabled | boolean | Indica si el escritorio puede reservarse. |
| created_at | timestamp | Fecha de creación. |
| updated_at | timestamp | Fecha de última actualización. |

#### reservations

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid | Identificador único de la reserva. |
| desk_id | uuid | Escritorio reservado. |
| member_id | uuid | Miembro que realizó la reserva. |
| date | date | Fecha de la reserva. |
| start_time | time | Horario de inicio. |
| end_time | time | Horario de fin. |
| status | varchar | Estado de la reserva. |
| created_at | timestamp | Fecha de creación. |
| cancelled_at | timestamp | Fecha de cancelación, si aplica. |

### 11.2 Consulta conceptual de disponibilidad

Un escritorio está disponible si no existe una reserva activa del mismo escritorio que se superponga con el rango solicitado.

```sql
SELECT d.*
FROM desks d
WHERE d.enabled = true
AND NOT EXISTS (
  SELECT 1
  FROM reservations r
  WHERE r.desk_id = d.id
  AND r.date = :date
  AND r.status = 'ACTIVE'
  AND r.start_time < :endTime
  AND r.end_time > :startTime
);
```

---

## 12. Pruebas esperadas

### 12.1 Pruebas unitarias

- Devuelve escritorios disponibles cuando no existen reservas activas.
- Excluye escritorios con reservas activas superpuestas.
- No excluye escritorios con reservas canceladas.
- Rechaza una consulta sin fecha.
- Rechaza una consulta sin horario de inicio.
- Rechaza una consulta sin horario de fin.
- Rechaza un rango horario inválido.
- Devuelve lista vacía cuando no existen escritorios disponibles.

### 12.2 Pruebas de integración

- El endpoint responde correctamente con parámetros válidos.
- El endpoint devuelve `400` ante parámetros incompletos.
- El endpoint devuelve `400` ante rango horario inválido.
- La consulta a base de datos excluye reservas activas superpuestas.
- La consulta ignora reservas canceladas.

### 12.3 Pruebas mobile / E2E

- El miembro puede seleccionar fecha y horario desde la app.
- La app muestra escritorios disponibles.
- La app muestra un estado vacío cuando no hay escritorios disponibles.
- La app muestra un mensaje claro ante errores de validación.

---

## 13. Consideraciones no funcionales

- **Rendimiento:** la consulta de disponibilidad debe responder en menos de 2 segundos bajo condiciones normales.
- **Conectividad:** la consulta requiere conexión a internet para garantizar información sincronizada.
- **Idioma:** todos los mensajes visibles para el usuario deben estar en español.
- **Accesibilidad:** la interfaz debe respetar contraste mínimo WCAG AA.
- **Usabilidad:** el flujo debe ser simple y navegable desde dispositivos móviles.
- **Seguridad:** en el MVP, la consulta puede requerir autenticación si el flujo de reservas se encuentra restringido a miembros registrados.
- **Observabilidad:** deben registrarse errores inesperados de consulta para facilitar diagnóstico.

---

## 14. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| Calcular disponibilidad desde reservas y no desde un estado fijo del escritorio | Permite que un mismo escritorio esté disponible o no según fecha y horario. Escala mejor para agendas futuras. |
| Usar un caso de uso específico para disponibilidad | Mantiene separada la lógica de consulta de la lógica de creación de reservas. |
| Ignorar reservas canceladas en el cálculo | Una cancelación debe liberar el escritorio inmediatamente. |
| Responder lista vacía cuando no hay resultados | Simplifica el consumo desde mobile y evita tratar la ausencia de disponibilidad como error técnico. |
| Validar rango horario antes de consultar la base de datos | Evita consultas innecesarias y concentra reglas básicas en la capa de aplicación. |

---

## 15. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Consultas lentas al crecer la cantidad de reservas | Medio | Indexar `desk_id`, `date`, `status`, `start_time` y `end_time`. |
| Inconsistencias por reservas simultáneas | Alto | Revalidar disponibilidad en el caso de uso de creación de reserva. |
| Validaciones duplicadas entre mobile y backend | Bajo | Mantener validación estricta en backend y validación asistida en mobile. |
| Confusión entre escritorio reservado y escritorio no disponible | Medio | Modelar disponibilidad como resultado temporal derivado de reservas activas. |

---

## 16. Criterio de finalización

La función se considera terminada cuando:

- [ ] El miembro puede consultar disponibilidad desde la app mobile.
- [ ] El backend expone el endpoint de consulta de disponibilidad.
- [ ] La consulta filtra correctamente reservas activas superpuestas.
- [ ] Las reservas canceladas no bloquean disponibilidad.
- [ ] Los rangos horarios inválidos son rechazados.
- [ ] La respuesta sin resultados se maneja correctamente.
- [ ] El endpoint está documentado en Swagger.
- [ ] Existen pruebas unitarias del caso de uso.
- [ ] Existen pruebas de integración del endpoint.
- [ ] La consulta cumple el rendimiento esperado para el MVP.
