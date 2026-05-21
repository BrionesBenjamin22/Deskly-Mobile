export class ReservationNotFoundError extends Error {
  constructor() {
    super('No se encontro la reserva solicitada.');
    this.name = ReservationNotFoundError.name;
  }
}
