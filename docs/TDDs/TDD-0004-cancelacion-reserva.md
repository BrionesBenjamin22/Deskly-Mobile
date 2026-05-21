---
id: TDD-0004
estado: Propuesto
autor: Equipo Deskly
fecha: 2026-05-20
titulo: Cancelación de reserva
modulo: Reservas
entrega: Entrega 1 - MVP
---

# TDD-0004: Cancelación de reserva

## 1. Contexto de negocio

### 1.1 Problema

Un miembro puede no asistir al coworking y necesita cancelar su reserva para liberar el escritorio, permitiendo que otro miembro pueda utilizarlo.

### 1.2 Objetivo

Permitir que un miembro cancele una reserva activa propia, actualizando su estado y liberando el escritorio para nuevas reservas.

### 1.3 User Persona

- **Actor principal:** Miembro.
- **Necesidad:** Cancelar una reserva que ya no utilizará.
- **Problemática actual:** Mantener bloqueado un recurso que podría ser usado por otro miembro.

---

## 2. Alcance funcional

### 2.1 Incluido

- Cancelar una reserva activa.
- Validar que la reserva pertenezca al miembro autenticado.
- Cambiar el estado de la reserva a cancelada.
- Registrar la fecha y hora de cancelación.
- Liberar el escritorio para futuras consultas de disponibilidad.

### 2.2 No incluido

- Penalizaciones por cancelación tardía.
- Reembolsos o pagos.
- Notificaciones push a otros miembros.
- Historial administrativo de cancelaciones.
- Reglas avanzadas de cancelación por anticipación mínima.

---

## 3. User Story asociada

**Como** Miembro  
**quiero** cancelar la reserva de un escritorio  
**para** liberar el espacio en caso de no poder asistir.

---

## 4. Criterios de aceptación

### CA-01: Cancelación exitosa

**Dado** que el miembro posee una reserva activa  
**cuando** confirma la cancelación  
**entonces** el sistema cambia el estado de la reserva a cancelada y libera el escritorio.

### CA-02: Reserva inexistente
<!--(Desde backend)-->
*Dado* que la reserva indicada no existe  
*cuando* el miembro intenta cancelarla  
*entonces* el sistema informa que la reserva no fue encontrada.

### CA-03: Reserva de otro miembro
<!--(Desde backend)-->
*Dado* que la reserva pertenece a otro miembro  
*cuando* el miembro intenta cancelarla  
*entonces* el sistema rechaza la operación por falta de autorización.

### CA-04: Reserva ya cancelada
<!--(Desde backend)-->
*Dado* que la reserva ya se encuentra cancelada  
*cuando* el miembro intenta cancelarla nuevamente  
*entonces* el sistema rechaza la operación porque la reserva ya no está activa.

---

## 5. Reglas de negocio

- **RN-01:** Solo el propietario de la reserva puede cancelarla.
- **RN-02:** Solo pueden cancelarse reservas activas.
- **RN-03:** Una reserva cancelada no bloquea disponibilidad.
- **RN-04:** La cancelación debe registrar fecha y hora de cancelación.
- **RN-05:** En el MVP, cancelar una reserva no genera penalización.
- **RN-06:** La cancelación no elimina físicamente la reserva; solo cambia su estado.

---

## 6. Modelo de dominio involucrado

### Entidades principales

- `Reservation`
- `Member`
- `Desk`

### Value Objects sugeridos

- `ReservationStatus`
- `CancellationTimestamp`

### Estados relevantes

- `ACTIVE`
- `CANCELLED`

---

## 7. Contratos de aplicación

### 7.1 Caso de uso principal

```ts
CancelReservationUseCase.execute(
  input: CancelReservationInput,
): Promise<CancelReservationOutput>
```

### 7.2 Input DTO

```ts
type CancelReservationInput = {
  memberId: string;
  reservationId: string;
};
```

### 7.3 Output DTO

```ts
type CancelReservationOutput = {
  reservationId: string;
  status: "CANCELLED";
  cancelledAt: string;
};
```

---

## 8. Diseño técnico propuesto

### 8.1 Arquitectura

La función se implementará siguiendo arquitectura hexagonal:

- **Dominio:** método de cancelación sobre la entidad `Reservation`.
- **Aplicación:** caso de uso `CancelReservationUseCase`.
- **Infraestructura:** persistencia del cambio de estado.
- **Presentación:** endpoint HTTP autenticado y documentado en Swagger.

### 8.2 Puertos requeridos

```ts
interface ReservationRepositoryPort {
  findById(reservationId: string): Promise<Reservation | null>;
  save(reservation: Reservation): Promise<Reservation>;
}
```

### 8.3 Método de dominio sugerido

```ts
class Reservation {
  cancel(requestingMemberId: string, cancelledAt: Date): void {
    if (this.memberId !== requestingMemberId) {
      throw new ReservationOwnershipError();
    }

    if (this.status !== "ACTIVE") {
      throw new ReservationCannotBeCancelledError();
    }

    this.status = "CANCELLED";
    this.cancelledAt = cancelledAt;
  }
}
```

---

## 9. API propuesta

### Endpoint

```http
PATCH /reservations/:reservationId/cancel
```

### Response exitosa

```json
{
  "reservationId": "res_001",
  "status": "CANCELLED",
  "cancelledAt": "2026-06-01T10:30:00.000Z"
}
```

### Errores esperados

| Código | Motivo | Descripción |
|---|---|---|
| 401 | Unauthorized | El usuario no está autenticado |
| 403 | Forbidden | La reserva pertenece a otro miembro |
| 404 | Not Found | La reserva no existe |
| 409 | Invalid status | La reserva no puede cancelarse porque no está activa |

---

## 10. Validaciones

- El usuario debe estar autenticado.
- El `reservationId` debe existir.
- La reserva debe pertenecer al miembro autenticado.
- La reserva debe estar activa.
- La cancelación debe persistir `cancelledAt`.

---

## 11. Pruebas esperadas

### Unitarias

- Cancela una reserva activa propia.
- Rechaza cancelar una reserva de otro miembro.
- Rechaza cancelar una reserva inexistente.
- Rechaza cancelar una reserva ya cancelada.
- Registra correctamente `cancelledAt`.

### Integración

- El endpoint actualiza el estado correctamente.
- La reserva cancelada deja de bloquear disponibilidad.
- El endpoint devuelve 403 cuando la reserva no pertenece al miembro.
- El endpoint devuelve 409 cuando la reserva no está activa.

### E2E / Mobile

- El miembro puede cancelar una reserva desde “Mis reservas”.
- Luego de cancelar, la reserva deja de aparecer como activa.
- El escritorio vuelve a aparecer en disponibilidad para ese período.

---

## 12. Consideraciones no funcionales

- **Seguridad:** solo el dueño de la reserva puede cancelarla.
- **Consistencia:** la reserva no debe eliminarse físicamente.
- **Usabilidad:** la app debe solicitar confirmación antes de cancelar.
- **Idioma:** los mensajes visibles deben estar en español.
- **Rendimiento:** la operación debe completarse en menos de 2 segundos bajo condiciones normales.

---

## 13. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| Usar estado `CANCELLED` | Permite conservar trazabilidad |
| No eliminar la reserva | Evita pérdida de información histórica |
| Validar propiedad en dominio | Refuerza la regla crítica del negocio |
| Usar endpoint específico `/cancel` | Expresa claramente la intención de negocio |

---

## 14. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cancelar reservas ajenas | Alto | Validar `memberId` desde autenticación |
| Inconsistencia de disponibilidad | Alto | Excluir reservas canceladas en consultas |
| Cancelación accidental | Medio | Confirmación previa en mobile |
| Pérdida de trazabilidad | Medio | No eliminar físicamente la reserva |

---

## 15. Criterio de finalización

La función se considera terminada cuando:

- [ ] El miembro puede cancelar desde la app mobile.
- [ ] Se valida propiedad de la reserva.
- [ ] Solo se cancelan reservas activas.
- [ ] La reserva cancelada libera disponibilidad.
- [ ] El endpoint está documentado en Swagger.
- [ ] Existen pruebas unitarias del caso de uso.
