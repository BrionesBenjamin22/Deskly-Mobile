import { InvalidReservationDateError } from '../errors/invalid-reservation-date.error';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ReservationDate {
  private constructor(readonly value: string) {}

  static create(value: string): ReservationDate {
    if (!DATE_PATTERN.test(value)) {
      throw new InvalidReservationDateError();
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      value !== date.toISOString().slice(0, 10)
    ) {
      throw new InvalidReservationDateError();
    }

    return new ReservationDate(value);
  }

  toPersistenceDate(): Date {
    return new Date(`${this.value}T00:00:00.000Z`);
  }
}
