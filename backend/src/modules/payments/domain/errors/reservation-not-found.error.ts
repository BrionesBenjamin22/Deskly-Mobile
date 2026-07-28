export class ReservationNotFoundError extends Error {
  constructor() {
    super('Reservation not found.');
    this.name = 'ReservationNotFoundError';
    Object.setPrototypeOf(this, ReservationNotFoundError.prototype);
  }
}
