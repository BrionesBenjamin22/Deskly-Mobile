export class InvalidReservationDateError extends Error {
  constructor() {
    super('La fecha debe tener formato YYYY-MM-DD.');
    this.name = InvalidReservationDateError.name;
  }
}
