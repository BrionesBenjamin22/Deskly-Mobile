---
id: TDD-0005
estado: Propuesto
autor: Equipo Deskly
fecha: 2026-05-20
titulo: Confirmación visual de reserva
modulo: Reservas
entrega: Entrega 1 - MVP
---

# TDD-0005: Confirmación visual de reserva

## 1. Contexto de negocio

### 1.1 Problema

Después de intentar reservar un escritorio, el miembro necesita saber de forma inmediata si la operación fue exitosa o si ocurrió un conflicto de disponibilidad.

### 1.2 Objetivo

Mostrar al miembro una confirmación visual clara al crear una reserva, incluyendo los detalles principales de la operación o un mensaje específico cuando el escritorio ya no esté disponible.

### 1.3 User Persona

- **Actor principal:** Miembro.
- **Necesidad:** Confirmar si su reserva fue realizada.
- **Problemática actual:** Incertidumbre sobre el resultado de la operación.

---

## 2. Alcance funcional

### 2.1 Incluido

- Mostrar confirmación visual de reserva exitosa.
- Mostrar fecha, horario y escritorio reservado.
- Informar conflicto de disponibilidad.
- Sugerir al usuario seleccionar otro escritorio ante conflicto.
- Mostrar mensajes en español.

### 2.2 No incluido

- Notificaciones push.
- Envío de emails.
- Integración con calendario externo.
- Confirmaciones offline.
- Recordatorios previos a la reserva.

---

## 3. User Story asociada

**Como** Miembro  
**quiero** recibir una confirmación inmediata al momento de reservar un espacio de trabajo  
**para** confirmar que la operación se realizó con éxito.

---

## 4. Criterios de aceptación

### CA-01: Confirmación exitosa

**Dado** que el miembro selecciona un escritorio disponible y confirma la reserva  
**cuando** la operación se procesa correctamente  
**entonces** el sistema muestra una confirmación visual con los detalles de la reserva.

### CA-02: Conflicto de disponibilidad

**Dado** que ocurre un conflicto de disponibilidad antes de finalizar la reserva  
**cuando** el miembro intenta reservar  
**entonces** el sistema informa que el escritorio ya no está disponible y sugiere seleccionar otro.

### CA-03: Error genérico

**Dado** que ocurre un error inesperado  
**cuando** el miembro intenta reservar  
**entonces** el sistema muestra un mensaje claro sin exponer detalles técnicos internos.

---

## 5. Reglas de negocio

- **RN-01:** Toda reserva creada exitosamente debe generar una respuesta clara para el usuario.
- **RN-02:** La confirmación debe incluir fecha, horario y escritorio asignado.
- **RN-03:** Los errores de conflicto deben diferenciarse de errores genéricos.
- **RN-04:** Los mensajes visibles deben estar redactados en español.
- **RN-05:** La UI debe cumplir contraste mínimo WCAG AA.
- **RN-06:** La confirmación visual no reemplaza la persistencia de la reserva; solo comunica el resultado.

---

## 6. Modelo de dominio involucrado

### Entidades principales

- `Reservation`
- `Desk`
- `Member`

### Eventos sugeridos

- `ReservationCreated`
- `ReservationCreationRejected`

### Errores de dominio sugeridos

- `DeskAlreadyReservedError`
- `InvalidReservationPeriodError`

---

## 7. Contratos de aplicación

Este TDD no requiere necesariamente un caso de uso independiente si la confirmación visual se implementa en la capa mobile como resultado del caso de uso de creación de reserva.

Sin embargo, el backend debe devolver información suficiente para que mobile pueda construir la confirmación.

### 7.1 Output mínimo requerido desde backend

```ts
type ReservationConfirmationOutput = {
  reservationId: string;
  deskId: string;
  deskCode: string;
  deskName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE";
};
```

### 7.2 Error esperado ante conflicto

```ts
type ReservationConflictOutput = {
  statusCode: 409;
  error: "Desk unavailable";
  message: string;
};
```

---

## 8. Diseño técnico propuesto

### 8.1 Arquitectura

La función se implementará como una integración entre backend y mobile:

- **Dominio:** el conflicto de disponibilidad debe representarse como error de dominio.
- **Aplicación:** `CreateReservationUseCase` debe devolver la reserva creada o propagar errores específicos.
- **Presentación backend:** el error de disponibilidad debe mapearse a HTTP 409.
- **Mobile:** debe mostrar estado exitoso, conflicto o error genérico.

### 8.2 Error de dominio sugerido

```ts
class DeskAlreadyReservedError extends Error {
  constructor() {
    super("El escritorio ya no se encuentra disponible para el horario seleccionado.");
  }
}
```

### 8.3 Mapeo de errores sugerido

| Error de dominio | HTTP | Mensaje mobile |
|---|---:|---|
| `DeskAlreadyReservedError` | 409 | El escritorio ya no está disponible. Seleccioná otro escritorio. |
| `InvalidReservationPeriodError` | 400 | Revisá la fecha y el horario seleccionados. |
| Error inesperado | 500 | Ocurrió un error inesperado. Intentá nuevamente. |

---

## 9. API relacionada

### Endpoint

```http
POST /reservations
```

### Response exitosa

```json
{
  "reservationId": "res_001",
  "deskId": "desk_001",
  "deskCode": "D-01",
  "deskName": "Escritorio 1",
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "13:00",
  "status": "ACTIVE"
}
```

### Response por conflicto

```json
{
  "statusCode": 409,
  "error": "Desk unavailable",
  "message": "El escritorio ya no está disponible. Seleccioná otro escritorio."
}
```

### Response por error genérico

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Ocurrió un error inesperado. Intentá nuevamente."
}
```

---

## 10. Validaciones

- La respuesta exitosa debe incluir datos suficientes para mostrar la confirmación.
- El conflicto de disponibilidad debe mapearse como 409.
- La app mobile debe diferenciar error de conflicto y error genérico.
- Los mensajes visibles no deben exponer errores internos.
- La confirmación debe mostrarse inmediatamente después de una reserva exitosa.

---

## 11. Pruebas esperadas

### Unitarias

- El backend devuelve los datos necesarios para confirmar la reserva.
- El error de disponibilidad se representa como conflicto.
- El mensaje de conflicto es específico.
- El mensaje genérico no expone detalles técnicos.

### Integración

- `POST /reservations` devuelve la reserva creada con datos suficientes.
- `POST /reservations` devuelve 409 ante conflicto de disponibilidad.
- El contrato de respuesta es compatible con la pantalla mobile.

### E2E / Mobile

- Flujo exitoso: buscar disponibilidad → seleccionar escritorio → reservar → ver confirmación.
- Flujo con conflicto: seleccionar escritorio → reservar → ver mensaje específico.
- Flujo con error genérico: mostrar mensaje claro y permitir reintentar.

---

## 12. Consideraciones no funcionales

- **Usabilidad:** la confirmación debe ser clara y visible.
- **Accesibilidad:** la UI debe respetar contraste mínimo WCAG AA.
- **Idioma:** todos los mensajes deben estar en español.
- **Seguridad:** no deben exponerse detalles técnicos internos.
- **Consistencia:** los mensajes deben ser coherentes con el resto de la app.

---

## 13. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| No crear un caso de uso independiente para confirmación | La confirmación visual es consecuencia de la creación de reserva |
| Usar HTTP 409 para conflicto | Representa adecuadamente una colisión de disponibilidad |
| Devolver datos completos de la reserva | Evita consultas adicionales desde mobile |
| Mantener mensajes en español | Cumple el alcance funcional y de interfaz |

---

## 14. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Mensaje ambiguo ante conflicto | Medio | Mapear error 409 a texto específico |
| Confirmación con datos incompletos | Medio | Definir contrato mínimo de respuesta |
| Exposición de detalles técnicos | Alto | Usar mensajes controlados |
| Mala accesibilidad visual | Medio | Validar contraste mínimo WCAG AA |

---

## 15. Criterio de finalización

La función se considera terminada cuando:

- [ ] La app muestra confirmación visual de reserva exitosa.
- [ ] La confirmación incluye escritorio, fecha y horario.
- [ ] El conflicto de disponibilidad devuelve HTTP 409.
- [ ] El conflicto se muestra con mensaje específico.
- [ ] El usuario puede volver a seleccionar otro escritorio.
- [ ] Los mensajes están en español.
- [ ] La pantalla respeta criterios mínimos de accesibilidad.
