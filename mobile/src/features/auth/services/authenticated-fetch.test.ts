import type { LoginResponse } from '../types/auth.types';
import { authenticatedFetch } from './authenticated-fetch';
import { replaceRuntimeSession } from './session-runtime';

const session: LoginResponse = {
  access_token: 'expired-access',
  refresh_token: 'valid-refresh',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    username: 'member',
    role: 'MIEMBRO',
    active: true,
    member: null,
  },
};

describe('authenticatedFetch', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock;
    replaceRuntimeSession(session);
  });

  it('renueva una vez y reintenta con el nuevo access token', async () => {
    fetchMock
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...session,
          access_token: 'new-access',
          refresh_token: 'new-refresh',
        }),
      })
      .mockResolvedValueOnce({ status: 200 });

    const response = await authenticatedFetch(
      'http://localhost/protected',
      'expired-access',
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost/protected',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-access',
        }),
      }),
    );
  });

  it('no intenta renovar una respuesta distinta de 401', async () => {
    fetchMock.mockResolvedValue({ status: 403 });

    await authenticatedFetch('http://localhost/protected', 'access');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
