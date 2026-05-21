import { InvalidTimeFormatError } from '../errors/invalid-time-format.error';
import { InvalidTimeRangeError } from '../errors/invalid-time-range.error';
import { TimeSlot } from './time-slot.vo';

describe('TimeSlot', () => {
  it('creates a valid time slot', () => {
    const timeSlot = TimeSlot.create('09:00', '13:00');

    expect(timeSlot.startTime).toBe('09:00');
    expect(timeSlot.endTime).toBe('13:00');
  });

  it('rejects an invalid time format', () => {
    expect(() => TimeSlot.create('9:00', '13:00')).toThrow(
      InvalidTimeFormatError,
    );
  });

  it('rejects an invalid time range', () => {
    expect(() => TimeSlot.create('13:00', '13:00')).toThrow(
      InvalidTimeRangeError,
    );
  });

  it('detects overlapping time slots', () => {
    const firstTimeSlot = TimeSlot.create('09:00', '13:00');
    const secondTimeSlot = TimeSlot.create('12:00', '14:00');

    expect(firstTimeSlot.overlaps(secondTimeSlot)).toBe(true);
  });

  it('detects non-overlapping time slots', () => {
    const firstTimeSlot = TimeSlot.create('09:00', '13:00');
    const secondTimeSlot = TimeSlot.create('13:00', '14:00');

    expect(firstTimeSlot.overlaps(secondTimeSlot)).toBe(false);
  });
});
