# Registro canonico de tareas

| ID | Modulo | Estado | Dependencia | Archivo | Codigo |
|---|---|---|---|---|---|
| `PAYMENTS-03` | Payments backend | `COMPLETADA` | Etapa 2 | `TASK_PAYMENTS_03_PAYMENT_CREATION.md` | `backend/src/modules/payments` |
| `PAYMENTS-04` | Payments backend | `COMPLETADA` | `PAYMENTS-03` | `TASK_PAYMENTS_04_MERCADO_PAGO.md` | `backend/src/modules/payments` |
| `PAYMENTS-05` | Payments backend | `COMPLETADA` | `PAYMENTS-04` | `TASK_PAYMENTS_05_WEBHOOKS.md` | `backend/src/modules/payments` |
| `PAYMENTS-06` | Payments backend | `COMPLETADA` | `PAYMENTS-05` | `TASK_PAYMENTS_06_HARDENING.md` | `backend/src/modules/payments` |
| `PAYMENTS-07` | Payments mobile/backend | `BLOQUEADA` | `PAYMENTS-06`; pendiente prueba manual sandbox | `TASK_PAYMENTS_07_FRONTEND_DOCUMENTATION.md` | `mobile/src`, `backend/src/modules/payments` |
| `SECURITY-01` | Dependencias backend | `COMPLETADA` | Ninguna | `TASK_SECURITY_01_DEPENDENCY_AUDIT.md` | `backend/package.json`, `backend/pnpm-lock.yaml` |
| `MOBILE-RESERVATIONS-LOCATION` | Reservations mobile | `PENDIENTE` | Ninguna | `TASK_MOBILE_RESERVATIONS_LOCATION_DETAILS.md` | `mobile/src/features/reservations` |
