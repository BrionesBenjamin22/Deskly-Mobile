export class ReservationCannotCheckInError extends Error {
  constructor() {
    super('Only an active reservation for today can validate arrival.');
  }
}
