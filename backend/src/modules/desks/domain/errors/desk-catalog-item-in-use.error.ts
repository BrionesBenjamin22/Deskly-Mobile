export class DeskCatalogItemInUseError extends Error {
  constructor() {
    super('El elemento del catalogo esta asociado a uno o mas escritorios.');
    this.name = DeskCatalogItemInUseError.name;
  }
}
