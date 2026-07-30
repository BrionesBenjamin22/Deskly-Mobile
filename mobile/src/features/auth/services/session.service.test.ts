import * as SecureStore from 'expo-secure-store';

import {
  clearPersistedSession,
  persistSession,
  restorePersistedSession,
} from './session.service';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);
const fetchMock = jest.fn();

const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    username: 'member',
    role: 'MIEMBRO' as const,
    active: true,
    member: {
      id: 'member-1',
      fullName: 'Deskly Member',
      active: true,
    },
  },
};

describe('session.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock;
    secureStore.isAvailableAsync.mockResolvedValue(true);
  });

  it('persiste access y refresh token en el almacenamiento seguro', async () => {
    await persistSession(session);

    expect(secureStore.setItemAsync.mock.calls).toEqual([
      [
        'deskly.session.access-token.v1',
        'access-token',
        { keychainAccessible: 'device-only' },
      ],
      [
        'deskly.session.refresh-token.v1',
        'refresh-token',
        { keychainAccessible: 'device-only' },
      ],
    ]);
  });

  it('restaura y rota la sesion mediante el refresh token', async () => {
    secureStore.getItemAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(session),
    });

    await expect(restorePersistedSession()).resolves.toMatchObject(session);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      }),
    );
  });

  it('elimina ambos tokens cuando el backend rechaza la renovacion', async () => {
    secureStore.getItemAsync
      .mockResolvedValueOnce('expired-access')
      .mockResolvedValueOnce('expired-refresh');
    fetchMock.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Sesion vencida.' }),
    });

    await expect(restorePersistedSession()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
  });

  it('conserva los tokens ante un fallo transitorio de red', async () => {
    secureStore.getItemAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    fetchMock.mockRejectedValue(new Error('Sin conexion.'));

    await expect(restorePersistedSession()).rejects.toMatchObject({
      name: 'SessionPersistenceError',
    });
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('elimina ambos tokens al cerrar o cambiar de cuenta', async () => {
    await clearPersistedSession();

    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
  });

  it('no informa persistencia exitosa si SecureStore no esta disponible', async () => {
    secureStore.isAvailableAsync.mockResolvedValue(false);

    await expect(persistSession(session)).rejects.toMatchObject({
      name: 'SessionPersistenceError',
    });
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
