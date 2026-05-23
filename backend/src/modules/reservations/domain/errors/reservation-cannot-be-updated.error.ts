export class ReservationCannotBeUpdatedError extends Error {
  constructor() {
    super('La reserva no puede actualizarse porque no se encuentra activa.');
    this.name = ReservationCannotBeUpdatedError.name;
  }
}
