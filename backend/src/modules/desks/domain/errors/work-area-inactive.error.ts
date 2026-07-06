export class WorkAreaInactiveError extends Error {
  constructor() {
    super('Work area is inactive.');
    this.name = 'WorkAreaInactiveError';
  }
}
