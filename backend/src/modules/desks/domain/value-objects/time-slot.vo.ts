import { InvalidTimeFormatError } from '../errors/invalid-time-format.error';
import { InvalidTimeRangeError } from '../errors/invalid-time-range.error';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TimeSlot {
  private constructor(
    readonly startTime: string,
    readonly endTime: string,
  ) {}

  static create(startTime: string, endTime: string): TimeSlot {
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      throw new InvalidTimeFormatError();
    }

    if (TimeSlot.toMinutes(endTime) <= TimeSlot.toMinutes(startTime)) {
      throw new InvalidTimeRangeError();
    }

    return new TimeSlot(startTime, endTime);
  }

  overlaps(other: TimeSlot): boolean {
    return (
      TimeSlot.toMinutes(this.startTime) < TimeSlot.toMinutes(other.endTime) &&
      TimeSlot.toMinutes(this.endTime) > TimeSlot.toMinutes(other.startTime)
    );
  }

  startToPersistenceDate(): Date {
    return TimeSlot.toPersistenceDate(this.startTime);
  }

  endToPersistenceDate(): Date {
    return TimeSlot.toPersistenceDate(this.endTime);
  }

  private static toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private static toPersistenceDate(value: string): Date {
    return new Date(`1970-01-01T${value}:00.000Z`);
  }
}
