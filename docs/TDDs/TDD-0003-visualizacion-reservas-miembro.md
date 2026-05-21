---
id: TDD-0003
estado: Propuesto
autor: Equipo Deskly
fecha: 2026-05-20
titulo: Visualización de reservas del miembro
modulo: Reservas
entrega: Entrega 1 - MVP
---

# TDD-0003: Visualización de reservas del miembro

## 1. Contexto de negocio

### 1.1 Problema

El miembro necesita consultar sus reservas para organizar su jornada y confirmar qué escritorio tiene asignado, en qué fecha y en qué horario.

### 1.2 Objetivo

Permitir que el miembro visualice sus reservas activas desde la aplicación móvil, mostrando la información necesaria para planificar su jornada.

### 1.3 User Persona

- **Actor principal:** Miembro.
- **Necesidad:** Ver sus reservas actuales.
- **Problemática actual:** No tener una referencia clara de las reservas realizadas.

---

## 2. Alcance funcional

### 2.1 Incluido

- Listar las reservas activas del miembro autenticado.
- Mostrar fecha, horario y escritorio asignado.
- Informar claramente cuando el miembro no tenga reservas activas.
- Ordenar las reservas por fecha y horario próximos.

### 2.2 No incluido

- Historial completo de reservas canceladas.
- Filtros avanzados por fecha o escritorio.
- Exportación de reservas.
- Gestión administrativa de reservas de otros miembros.

---

## 3. User Story asociada

**Como** Miembro  
**quiero** visualizar mis reservas actuales  
**para** organizar mi jornada laboral y confirmar mis espacios reservados.

---

## 4. Criterios de aceptación

### CA-01: Miembro con reservas activas

**Dado** que el miembro posee reservas activas  
**cuando** accede a la sección “Mis reservas”  
**entonces** el sistema muestra todas sus reservas activas con fecha, horario y escritorio asignado.

### CA-02: Miembro sin reservas activas

**Dado** que el miembro no posee reservas activas  
**cuando** accede a la sección “Mis reservas”  
**entonces** el sistema informa claramente que no posee reservas registradas.

### CA-03: Protección de datos de otros miembros

**Dado** que existen reservas activas pertenecientes a otros miembros  
**cuando** el miembro consulta sus reservas  
**entonces** el sistema no muestra reservas ajenas.

---

## 5. Reglas de negocio

- **RN-01:** Un miembro solo puede visualizar sus propias reservas.
- **RN-02:** En el MVP se muestran únicamente reservas activas.
- **RN-03:** Las reservas canceladas no deben aparecer en el listado de reservas activas.
- **RN-04:** Las reservas deben ordenarse por fecha y horario ascendente.
- **RN-05:** El sistema debe devolver una lista vacía cuando el miembro no tenga reservas activas.

---

## 6. Modelo de dominio involucrado

### Entidades principales

- `Reservation`
- `Desk`
- `Member`

### Estados relevantes

- `ACTIVE`
- `CANCELLED`

---

## 7. Contratos de aplicación

### 7.1 Caso de uso principal

```ts
GetMemberReservationsUseCase.execute(
  input: GetMemberReservationsInput,
): Promise<GetMemberReservationsOutput>
```

### 7.2 Input DTO

```ts
type GetMemberReservationsInput = {
  memberId: string;
};
```

### 7.3 Output DTO

```ts
type GetMemberReservationsOutput = {
  reservations: {
    id: string;
    deskId: string;
    deskCode: string;
    deskName?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "ACTIVE";
  }[];
};
```

---

## 8. Diseño técnico propuesto

### 8.1 Arquitectura

La función se implementará siguiendo arquitectura hexagonal:

- **Dominio:** reglas de propiedad de reservas.
- **Aplicación:** caso de uso `GetMemberReservationsUseCase`.
- **Infraestructura:** consulta de reservas por miembro y estado.
- **Presentación:** endpoint HTTP autenticado y documentado en Swagger.

### 8.2 Puertos requeridos

```ts
interface ReservationRepositoryPort {
  findActiveByMemberId(memberId: string): Promise<Reservation[]>;
}
```

### 8.3 Adaptadores requeridos

- `ReservationPersistenceAdapter`
- `ReservationHttpController`

---

## 9. API propuesta

### Endpoint

```http
GET /reservations/me
```

### Response exitosa

```json
{
  "reservations": [
    {
      "id": "res_001",
      "deskId": "desk_001",
      "deskCode": "D-01",
      "deskName": "Escritorio 1",
      "date": "2026-06-01",
      "startTime": "09:00",
      "endTime": "13:00",
      "status": "ACTIVE"
    }
  ]
}
```

### Response sin reservas

```json
{
  "reservations": []
}
```

### Errores esperados

| Código | Motivo | Descripción |
|---|---|---|
| 401 | Unauthorized | El usuario no está autenticado |
| 500 | Internal Server Error | Error inesperado del servidor |

---

## 10. Validaciones

- El usuario debe estar autenticado.
- El `memberId` debe obtenerse desde el contexto de autenticación, no desde el body de la request.
- No deben exponerse reservas de otros miembros.
- No deben listarse reservas canceladas como activas.

---

## 11. Pruebas esperadas

### Unitarias

- Devuelve reservas activas del miembro.
- No devuelve reservas de otros miembros.
- No devuelve reservas canceladas.
- Devuelve lista vacía cuando no hay reservas activas.
- Ordena las reservas por fecha y horario ascendente.

### Integración

- El endpoint filtra por usuario autenticado.
- La respuesta incluye información básica del escritorio.
- La consulta respeta el estado de la reserva.
- El endpoint responde correctamente cuando el miembro no tiene reservas.

### E2E / Mobile

- El miembro accede a “Mis reservas” y visualiza sus reservas activas.
- El miembro sin reservas ve un mensaje de estado vacío.
- La pantalla no muestra reservas canceladas.

---

## 12. Consideraciones no funcionales

- **Seguridad:** el endpoint debe requerir autenticación.
- **Privacidad:** el miembro no debe poder consultar reservas de terceros.
- **Usabilidad:** el estado vacío debe ser claro y comprensible.
- **Rendimiento:** la consulta debe responder en menos de 2 segundos bajo condiciones normales.
- **Idioma:** todos los mensajes visibles deben estar en español.

---

## 13. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| Usar `/reservations/me` | Evita exponer el `memberId` como parámetro manipulable |
| Filtrar por reservas activas | El MVP requiere visualizar reservas actuales |
| Devolver lista vacía | Simplifica el manejo del estado vacío en mobile |

---

## 14. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Exposición de reservas de otros usuarios | Alto | Obtener `memberId` desde autenticación |
| Listado con datos inconsistentes | Medio | Filtrar por estado activo |
| Mala experiencia sin reservas | Bajo | Diseñar estado vacío explícito |

---

## 15. Criterio de finalización

La función se considera terminada cuando:

- [ ] El miembro puede ver sus reservas desde la app mobile.
- [ ] Solo se muestran reservas propias.
- [ ] Solo se muestran reservas activas.
- [ ] El estado vacío está correctamente contemplado.
- [ ] El endpoint está documentado en Swagger.
- [ ] Existen pruebas unitarias del caso de uso.
