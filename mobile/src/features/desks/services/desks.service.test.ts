import { replaceRuntimeSession } from '../../auth/services/session-runtime';
import { createLocality, listLocalities } from './desks.service';

describe('desks.service authenticated mutations', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    replaceRuntimeSession(null);
    globalThis.fetch = fetchMock;
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

  it('autentica las lecturas con la sesion centralizada', async () => {
    replaceRuntimeSession({
      access_token: 'runtime-access-token',
      refresh_token: 'runtime-refresh-token',
      user: {
        id: 'user-1',
        email: 'member@deskly.test',
        username: 'member',
        role: 'MIEMBRO',
        active: true,
        member: null,
      },
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await listLocalities();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/localities'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer runtime-access-token',
        }),
      }),
    );
  });
});
