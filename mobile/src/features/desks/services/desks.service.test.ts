import { createLocality } from './desks.service';

describe('desks.service authenticated mutations', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'locality-1',
        name: 'Chascomús',
        active: true,
      }),
    });
  });

  it('conserva Content-Type al agregar Authorization', async () => {
    await createLocality({ name: 'Chascomús' }, 'access-token');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/localities'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
        },
        body: JSON.stringify({ name: 'Chascomús' }),
      }),
    );
  });
});
