import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import App from './App';
import {
  clearPersistedSession,
  restorePersistedSession,
} from './src/features/auth/services/session.service';

jest.mock('./src/features/auth/services/session.service', () => ({
  clearPersistedSession: jest.fn(),
  persistSession: jest.fn(),
  restorePersistedSession: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});
jest.mock('./src/components/ui/StatusModal', () => ({
  StatusModal: () => null,
}));
jest.mock('./src/features/auth/screens/AuthScreen', () => {
  const { Text } = require('react-native');
  return { AuthScreen: () => <Text>Inicio de sesion</Text> };
});
jest.mock('./src/features/auth/components/ChangePasswordModal', () => ({
  ChangePasswordModal: () => null,
}));
jest.mock('./src/features/auth/screens/ProfileScreen', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ProfileScreen: ({
      onPressAdminCatalog,
    }: {
      onPressAdminCatalog: () => void;
    }) => (
      <Pressable onPress={onPressAdminCatalog}>
        <Text>Volver al panel</Text>
      </Pressable>
    ),
  };
});
jest.mock('./src/features/desks/screens/DeskSettingsScreen', () => {
  const { Text } = require('react-native');
  return { DeskSettingsScreen: () => <Text>Configuracion</Text> };
});
jest.mock('./src/features/desks/screens/DesksScreen', () => {
  const { Text } = require('react-native');
  return { DesksScreen: () => <Text>Escritorios</Text> };
});
jest.mock('./src/features/desks/screens/WorkAreasScreen', () => {
  const { Text } = require('react-native');
  return { WorkAreasScreen: () => <Text>Areas</Text> };
});
jest.mock('./src/features/payments/screens/PaymentsScreen', () => {
  const { Text } = require('react-native');
  return { PaymentsScreen: () => <Text>Pagos</Text> };
});
jest.mock('./src/features/reservations/screens/MyReservationsScreen', () => {
  const { Text } = require('react-native');
  return { MyReservationsScreen: () => <Text>Reservas</Text> };
});
jest.mock('./src/features/users/screens/UserManagementScreen', () => {
  const { Text } = require('react-native');
  return { UserManagementScreen: () => <Text>Usuarios</Text> };
});
jest.mock('./src/features/admin/screens/AdminCatalogScreen', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AdminCatalogScreen: ({
      onPressLogout,
      onPressProfile,
    }: {
      onPressLogout: () => void;
      onPressProfile: () => void;
    }) => (
      <>
        <Pressable onPress={onPressLogout}>
          <Text>Panel administrativo</Text>
        </Pressable>
        <Pressable onPress={onPressProfile}>
          <Text>Abrir perfil</Text>
        </Pressable>
      </>
    ),
  };
});

const restoreSessionMock = jest.mocked(restorePersistedSession);
const clearSessionMock = jest.mocked(clearPersistedSession);
const adminSession = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  user: {
    id: 'admin-1',
    email: 'admin@example.com',
    username: 'admin',
    role: 'ADMIN' as const,
    active: true,
    member: null,
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe('App secure session lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSessionMock.mockResolvedValue();
  });

  it('no muestra contenido publico ni autenticado antes de validar el token', async () => {
    const restoration = deferred<typeof adminSession | null>();
    restoreSessionMock.mockReturnValue(restoration.promise);

    render(<App />);

    expect(screen.getByLabelText('Restaurando sesión')).toBeTruthy();
    expect(screen.queryByText('Inicio de sesion')).toBeNull();
    expect(screen.queryByText('Panel administrativo')).toBeNull();

    restoration.resolve(adminSession);

    await waitFor(() =>
      expect(screen.getByText('Panel administrativo')).toBeTruthy(),
    );
  });

  it('mantiene la sesion visible hasta eliminar la credencial segura', async () => {
    const deletion = deferred<void>();
    restoreSessionMock.mockResolvedValue(adminSession);
    clearSessionMock.mockReturnValue(deletion.promise);

    render(<App />);
    const panel = await screen.findByText('Panel administrativo');

    fireEvent.press(panel);

    expect(screen.queryByText('Panel administrativo')).toBeTruthy();
    expect(screen.queryByText('Inicio de sesion')).toBeNull();

    deletion.resolve();

    await waitFor(() =>
      expect(screen.getByText('Inicio de sesion')).toBeTruthy(),
    );
  });

  it('permite volver al panel administrativo desde el perfil', async () => {
    restoreSessionMock.mockResolvedValue(adminSession);

    render(<App />);

    fireEvent.press(await screen.findByText('Abrir perfil'));
    fireEvent.press(await screen.findByText('Volver al panel'));

    await waitFor(() =>
      expect(screen.getByText('Panel administrativo')).toBeTruthy(),
    );
  });
});
