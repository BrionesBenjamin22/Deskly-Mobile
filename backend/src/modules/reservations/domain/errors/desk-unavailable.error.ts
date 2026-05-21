export class DeskUnavailableError extends Error {
  constructor() {
    super('El escritorio ya no esta disponible para el periodo solicitado.');
    this.name = DeskUnavailableError.name;
  }
}
