# Penalizaciones en mobile

## Componentes

- `PenaltyReasonModal`: solicita al gestor el motivo de una cancelacion por ausencia.
- `useRegisterAbsence`: valida el motivo, ejecuta la operacion y expone feedback uniforme.
- `penalties.service`: consume el endpoint protegido usando el token de la sesion.

## Flujo

Cuando un usuario con rol `GESTOR` selecciona `Cancelar Reserva`, se solicita el motivo. El backend valida la hora de tolerancia, cancela la reserva y determina si corresponde advertencia o penalizacion. Los miembros mantienen el flujo normal de cancelacion, que puede generar una infraccion automatica si faltan dos horas o menos para el inicio.

El gestor ingresa directamente a una vista de reservas activas del dia. Puede validar la llegada o cancelar por ausencia. Una reserva validada permanece visible con estado claro y sin acciones pendientes. Su barra inferior contiene unicamente `Reservas` y `Perfil`.

## Validaciones y permisos

El motivo debe contener entre 3 y 500 caracteres. La interfaz solo expone el registro manual al rol `GESTOR`; el backend vuelve a validar el rol, la reserva y el periodo de tolerancia.
