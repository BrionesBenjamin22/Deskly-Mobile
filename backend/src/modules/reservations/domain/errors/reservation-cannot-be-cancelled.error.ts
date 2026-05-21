export class ReservationCannotBeCancelledError extends Error {
  constructor() {
    super('La reserva no puede cancelarse porque no se encuentra activa.');
    this.name = ReservationCannotBeCancelledError.name;
  }
}
