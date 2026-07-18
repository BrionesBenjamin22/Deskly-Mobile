# Plan estructurado del modulo Payments

## Objetivo

Descomponer la implementacion del flujo electronico en etapas verificables. Cada etapa debe ejecutarse solo despues de la aprobacion explicita de la anterior y debe cerrar los riesgos que recibe como obligatorios.

## Reglas de ejecucion

- No iniciar una etapa sin aprobacion del usuario.
- Aplicar desarrollo test-first en reglas de dominio, persistencia, seguridad y concurrencia.
- No instalar dependencias ni integrar servicios externos sin aprobacion.
- No realizar commits automaticamente.
- No cerrar una etapa con riesgos heredados abiertos. Si existe un bloqueo real, detenerse y solicitar una decision.
- Mantener separados estado de pago y estado de reserva.
- Nunca confiar en monto, retorno visual o estado informado por el frontend.
- Todo cambio externo a Payments debe limitarse al contrato aprobado y validarse con la suite del modulo afectado.

## Secuencia

1. `STAGE_2_PERSISTENCE.md`: esquema, migracion, repositorio, eventos y restricciones.
2. `STAGE_3_PAYMENT_CREATION.md`: reserva pendiente, calculo backend, idempotencia y endpoints protegidos.
3. `STAGE_4_MERCADO_PAGO.md`: adaptador real de Checkout Pro y configuracion segura.
4. `STAGE_5_WEBHOOKS.md`: firma, replay, verificacion y actualizacion transaccional.
5. `STAGE_6_HARDENING.md`: seguridad, concurrencia, fallos parciales y regresion completa.
6. `STAGE_7_FRONTEND_DOCUMENTATION.md`: checkout mobile/web, consulta de estado y cierre documental.

## Trazabilidad de riesgos

Cada documento contiene una tabla `Riesgos heredados obligatorios`. Sus filas deben pasar a `Cerrado` mediante pruebas y evidencia antes del informe final de la etapa. Los riesgos nuevos detectados deben incorporarse como entradas obligatorias del documento siguiente antes de detenerse.

## Decisiones aprobadas

- Proveedor objetivo: Mercado Pago Checkout Pro.
- Gateway fake obligatorio para pruebas.
- Reserva inicial: `PENDING_PAYMENT`.
- Reserva confirmada: `RESERVED` solo tras pago `APPROVED` verificado.
- Hold: 15 minutos.
- Tarifa: ARS 1.500 por hora.
- Opciones: seña del 30% o pago total.
- No se admite monto personalizado.
- Version de precios inicial: `ARS_1500_HOUR_DEPOSIT_30_V1`.

