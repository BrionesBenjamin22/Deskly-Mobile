export class WorkAreaNotFoundError extends Error {
  constructor() {
    super('Work area not found.');
    this.name = 'WorkAreaNotFoundError';
  }
}
