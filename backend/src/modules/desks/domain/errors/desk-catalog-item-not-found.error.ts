export class DeskCatalogItemNotFoundError extends Error {
  constructor() {
    super('No se encontro el elemento de catalogo solicitado.');
    this.name = DeskCatalogItemNotFoundError.name;
  }
}
