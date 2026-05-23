export class DeskNotFoundError extends Error {
  constructor() {
    super('No se encontro el escritorio solicitado.');
    this.name = DeskNotFoundError.name;
  }
}
