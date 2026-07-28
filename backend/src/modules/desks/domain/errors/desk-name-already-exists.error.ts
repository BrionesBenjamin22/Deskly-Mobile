export class DeskNameAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe un escritorio con el nombre informado.');
    this.name = DeskNameAlreadyExistsError.name;
  }
}
