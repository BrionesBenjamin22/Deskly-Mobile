export class InvalidTimeRangeError extends Error {
  constructor() {
    super('El horario de fin debe ser posterior al horario de inicio.');
    this.name = InvalidTimeRangeError.name;
  }
}
