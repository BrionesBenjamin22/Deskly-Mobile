export class LocalityInactiveError extends Error {
  constructor() {
    super('Locality is inactive.');
    this.name = 'LocalityInactiveError';
  }
}
