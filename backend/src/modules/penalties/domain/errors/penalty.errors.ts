export class PenaltyReservationNotFoundError extends Error {
  constructor() {
    super('Reservation not found.');
  }
}

export class PenaltyAlreadyExistsError extends Error {
  constructor() {
    super('The reservation already has an infraction.');
  }
}

export class AbsenceToleranceNotReachedError extends Error {
  constructor() {
    super('The absence tolerance period has not elapsed.');
  }
}

export class ReservationNotActiveForAbsenceError extends Error {
  constructor() {
    super('Only active reservations can be cancelled due to absence.');
  }
}

export class ReservationAlreadyCheckedInError extends Error {
  constructor() {
    super('A checked-in reservation cannot be cancelled due to absence.');
  }
}
