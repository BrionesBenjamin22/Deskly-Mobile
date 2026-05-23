export class DeskCodeAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe un escritorio con el codigo informado.');
    this.name = DeskCodeAlreadyExistsError.name;
  }
}
