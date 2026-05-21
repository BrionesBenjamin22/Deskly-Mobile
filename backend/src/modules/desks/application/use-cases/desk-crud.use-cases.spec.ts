import { Desk } from '../../domain/entities/desk.entity';
import { DeskCodeAlreadyExistsError } from '../../domain/errors/desk-code-already-exists.error';
import { DeskNotFoundError } from '../../domain/errors/desk-not-found.error';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { CreateDeskUseCase } from './create-desk.use-case';
import { DeleteDeskUseCase } from './delete-desk.use-case';
import { GetDeskByIdUseCase } from './get-desk-by-id.use-case';
import { ListDesksUseCase } from './list-desks.use-case';
import { UpdateDeskUseCase } from './update-desk.use-case';

const desk = new Desk({
  id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
  code: 'D-01',
  name: 'Escritorio 1',
  zone: 'A',
  amenities: [{ id: '6a3deca2-0063-4e6c-b1ee-a95666b5efdc', name: 'Monitor' }],
  enabled: true,
  createdAt: new Date('2026-05-21T10:00:00.000Z'),
  updatedAt: new Date('2026-05-21T10:00:00.000Z'),
});

function createRepositoryMock(): jest.Mocked<DeskRepositoryPort> {
  return {
    findAvailableByTimeSlot: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

describe('Desk CRUD use cases', () => {
  let repository: jest.Mocked<DeskRepositoryPort>;

  beforeEach(() => {
    repository = createRepositoryMock();
  });

  it('creates a desk when code is available', async () => {
    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue(desk);

    const output = await new CreateDeskUseCase(repository).execute({
      code: 'D-01',
      name: 'Escritorio 1',
      zone: 'A',
      amenityIds: ['6a3deca2-0063-4e6c-b1ee-a95666b5efdc'],
    });

    expect(output.code).toBe('D-01');
    expect(repository.create.mock.calls[0]?.[0]).toEqual({
      code: 'D-01',
      name: 'Escritorio 1',
      zone: 'A',
      amenityIds: ['6a3deca2-0063-4e6c-b1ee-a95666b5efdc'],
      enabled: true,
    });
  });

  it('rejects duplicated desk codes', async () => {
    repository.findByCode.mockResolvedValue(desk);

    await expect(
      new CreateDeskUseCase(repository).execute({ code: 'D-01' }),
    ).rejects.toThrow(DeskCodeAlreadyExistsError);
  });

  it('lists desks with default pagination', async () => {
    repository.list.mockResolvedValue({
      desks: [desk],
      total: 1,
    });

    const output = await new ListDesksUseCase(repository).execute({});

    expect(output.pagination).toEqual({
      page: 1,
      limit: 9,
      total: 1,
      totalPages: 1,
    });
    expect(output.desks).toHaveLength(1);
  });

  it('gets a desk by id', async () => {
    repository.findById.mockResolvedValue(desk);

    const output = await new GetDeskByIdUseCase(repository).execute(desk.id);

    expect(output.id).toBe(desk.id);
  });

  it('rejects missing desks on detail', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      new GetDeskByIdUseCase(repository).execute(desk.id),
    ).rejects.toThrow(DeskNotFoundError);
  });

  it('updates a desk with partial data', async () => {
    repository.findById.mockResolvedValue(desk);
    repository.update.mockResolvedValue(desk);

    await new UpdateDeskUseCase(repository).execute({
      id: desk.id,
      name: 'Escritorio actualizado',
    });

    expect(repository.update.mock.calls[0]?.[0]).toEqual({
      id: desk.id,
      name: 'Escritorio actualizado',
    });
  });

  it('soft deletes an existing desk', async () => {
    repository.findById.mockResolvedValue(desk);

    await new DeleteDeskUseCase(repository).execute(desk.id);

    expect(repository.softDelete.mock.calls[0]?.[0]).toBe(desk.id);
  });
});
