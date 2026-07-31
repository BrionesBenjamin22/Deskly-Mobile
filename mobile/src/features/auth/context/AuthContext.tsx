import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import type { LoginResponse } from '../types/auth.types';

type AuthContextValue = {
  session: LoginResponse;
  accessToken: string;
  user: LoginResponse['user'];
  role: LoginResponse['user']['role'];
};

type AuthProviderProps = PropsWithChildren<{
  session: LoginResponse | null;
}>;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children, session }: AuthProviderProps) {
  const value = useMemo<AuthContextValue | undefined>(
    () =>
      session
        ? {
            session,
            accessToken: session.access_token,
            user: session.user,
            role: session.user.role,
          }
        : undefined,
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  }

  return context;
}
