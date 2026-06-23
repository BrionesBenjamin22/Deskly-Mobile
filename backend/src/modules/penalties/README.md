# Modulo de penalizaciones

## Responsabilidad

Registra infracciones asociadas a una reserva y a su miembro. La primera infraccion del ultimo mes genera una advertencia; las siguientes generan penalizaciones efectivas. Tres penalizaciones efectivas activas bloquean temporalmente el acceso del usuario.

## Endpoints

- `POST /penalties/absence`: exclusivo para `GESTOR`. Recibe `reservationId` y `reason`. Requiere que haya transcurrido una hora desde el inicio, cancela la reserva y registra la infraccion.
- `GET /penalties?page=1&limit=9&memberId=`: lista infracciones. Un miembro solo obtiene las propias; gestores y administradores pueden filtrar por miembro.
- `GET /penalties/me?page=1&limit=3`: devuelve advertencias y penalizaciones activas del miembro autenticado para el resumen de perfil.
- `PATCH /reservations/:id/cancel`: registra automaticamente una infraccion cuando la cancelacion ocurre desde las dos horas previas al inicio, incluyendo cancelaciones posteriores al horario de comienzo.
- `PATCH /reservations/:id/check-in`: exclusivo para `GESTOR`; valida la llegada para una reserva activa del dia actual.

La consulta `GET /reservations` admite los filtros `status` y `date`, utilizados por la vista operativa del gestor.

Todos los endpoints de escritura relacionados requieren JWT. Los miembros solo pueden cancelar reservas propias.

## Modelo y reglas

`Penalty` se relaciona de manera obligatoria con `Reservation` y `Member`; `registeredById` referencia al gestor en ausencias y queda nulo en cancelaciones tardias automaticas. Cada reserva admite una sola infraccion.

Una reserva con `checkedInAt` no puede cancelarse por ausencia.

La vigencia termina en `activeUntil`, un mes despues de `registeredAt`. Al acumular tres registros activos de nivel `PENALTY`, el bloqueo temporal se guarda en `User.blockedUntil`; login y sesiones existentes quedan rechazados. Un administrador puede restituir el acceso desde Gestion de usuarios.

## Errores

- Reserva inexistente: `404`.
- Tolerancia aun no cumplida: `400`.
- Reserva procesada, inactiva o con infraccion previa: `409`.
- Rol sin permisos: `403`.
