export class InvalidTimeFormatError extends Error {
  constructor() {
    super('El horario debe tener formato HH:mm.');
    this.name = InvalidTimeFormatError.name;
  }
}
