import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StatusModal } from './src/components/ui/StatusModal';
import { DeskSettingsScreen } from './src/features/desks/screens/DeskSettingsScreen';
import { DesksScreen } from './src/features/desks/screens/DesksScreen';
import type { DeskAvailabilityContext } from './src/features/desks/screens/DesksScreen';
import { WorkAreasScreen } from './src/features/desks/screens/WorkAreasScreen';
import type { WorkArea } from './src/features/desks/types/desk.types';
import { PaymentsScreen } from './src/features/payments/screens/PaymentsScreen';
import { MyReservationsScreen } from './src/features/reservations/screens/MyReservationsScreen';
import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { ChangePasswordModal } from './src/features/auth/components/ChangePasswordModal';
import { ProfileScreen } from './src/features/auth/screens/ProfileScreen';
import { LoginResponse } from './src/features/auth/types/auth.types';
import {
  clearPersistedSession,
  persistSession,
  restorePersistedSession,
} from './src/features/auth/services/session.service';
import { subscribeToSession } from './src/features/auth/services/session-runtime';
import { UserManagementScreen } from './src/features/users/screens/UserManagementScreen';
import { AdminCatalogScreen } from './src/features/admin/screens/AdminCatalogScreen';
import { colors } from './src/theme/colors';

type AppTab =
  | 'desks'
  | 'reservations'
  | 'payments'
  | 'settings'
  | 'profile'
  | 'catalog'
  | 'users';
type DeskFlowScreen = 'areas' | 'desks';

type AuthFeedback = {
  title: string;
  description: string;
};
type AnimatedTabScreenProps = PropsWithChildren<{
  isActive: boolean;
}>;

function AnimatedTabScreen({ children, isActive }: AnimatedTabScreenProps) {
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isActive ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isActive, progress]);

  return (
    <Animated.View
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function App() {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback | undefined>();
  const [sessionError, setSessionError] = useState<AuthFeedback | undefined>();
  const [activeTab, setActiveTab] = useState<AppTab>('desks');
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(
    () => new Set(['desks']),
  );
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [reservationsRefreshKey, setReservationsRefreshKey] = useState(0);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [desksRefreshKey, setDesksRefreshKey] = useState(0);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [selectedWorkArea, setSelectedWorkArea] = useState<WorkArea | null>(
    null,
  );
  const [deskAvailabilityContext, setDeskAvailabilityContext] =
    useState<DeskAvailabilityContext>();
  const [deskFlowScreen, setDeskFlowScreen] =
    useState<DeskFlowScreen>('areas');

  const activateSession = (nextSession: LoginResponse) => {
    setAuthFeedback(undefined);
    setSession(nextSession);
    setSelectedWorkArea(null);
    setDeskAvailabilityContext(undefined);
    setDeskFlowScreen('areas');
    if (nextSession.user.role === 'GESTOR') {
      setActiveTab('reservations');
      setMountedTabs(new Set(['reservations']));
    } else if (nextSession.user.role === 'ADMIN') {
      setActiveTab('catalog');
      setMountedTabs(new Set(['catalog']));
    } else {
      setActiveTab('desks');
      setMountedTabs(new Set(['desks']));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const restoredSession = await restorePersistedSession();
        if (isMounted && restoredSession) {
          activateSession(restoredSession);
        }
      } catch {
        if (isMounted) {
          setAuthFeedback({
            title: 'No pudimos restaurar su sesion',
            description:
              'Lo sentimos! Verifique su conexion e ingrese nuevamente para continuar.',
          });
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(
    () =>
      subscribeToSession((nextSession) => {
        setSession(nextSession);
      }),
    [],
  );

  const handleTabChange = (tab: AppTab) => {
    if (tab === 'profile') {
      setProfileRefreshKey((current) => current + 1);
    }
    setMountedTabs((current) => {
      if (current.has(tab)) {
        return current;
      }

      const next = new Set(current);
      next.add(tab);
      return next;
    });
    setActiveTab(tab);
  };

  const resetSession = (feedback: AuthFeedback) => {
    setSession(null);
    setAuthFeedback(feedback);
    setActiveTab('desks');
    setMountedTabs(new Set(['desks']));
    setSelectedWorkArea(null);
    setDeskAvailabilityContext(undefined);
    setDeskFlowScreen('areas');
  };

  const endSession = async (feedback: AuthFeedback) => {
    try {
      await clearPersistedSession();
      setShowChangePassword(false);
      resetSession(feedback);
    } catch {
      setSessionError({
        title: 'No pudimos cerrar su sesión',
        description:
          'Lo sentimos! Intente nuevamente para eliminar la sesión de este dispositivo.',
      });
    }
  };

  const handleLogout = () => {
    void endSession({
      title: 'Sesión cerrada',
      description: 'Su sesión se cerró correctamente.',
    });
  };

  const handleSwitchAccount = () => {
    void endSession({
      title: 'Cambiar cuenta',
      description: 'Ingrese las credenciales de la cuenta que desea utilizar.',
    });
  };

  const handleAuthenticated = async (nextSession: LoginResponse) => {
    try {
      await persistSession(nextSession);
    } catch {
      setSessionError({
        title: 'Sesión solo en este momento',
        description:
          'Lo sentimos! No pudimos guardar la sesión de forma segura. Deberá ingresar nuevamente al reiniciar la aplicación.',
      });
    }
    activateSession(nextSession);
  };

  const handlePressDesks = () => {
    setSelectedWorkArea(null);
    setDeskFlowScreen('areas');
    handleTabChange('desks');
  };

  const handleBackToWorkAreas = (context: DeskAvailabilityContext) => {
    setDeskAvailabilityContext(context);
    setSelectedWorkArea(null);
    setDeskFlowScreen('areas');
  };

  const handleSelectWorkArea = (
    area: WorkArea,
    context: DeskAvailabilityContext,
  ) => {
    setSelectedWorkArea(area);
    setDeskAvailabilityContext(context);
    setDeskFlowScreen('desks');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {isRestoringSession ? (
          <View
            accessibilityLabel="Restaurando sesión"
            style={styles.restoringSession}
          >
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : !session ? (
          <AuthScreen
            onAuthenticated={handleAuthenticated}
            initialFeedback={authFeedback}
          />
        ) : mountedTabs.has('desks') ? (
          <AnimatedTabScreen isActive={activeTab === 'desks'}>
            {deskFlowScreen === 'areas' ? (
              <WorkAreasScreen
                userRole={session.user.role}
                initialAvailabilityContext={deskAvailabilityContext}
                refreshKey={desksRefreshKey}
                onSelectWorkArea={handleSelectWorkArea}
                onPressReservations={() => handleTabChange('reservations')}
                onPressPayments={() => handleTabChange('payments')}
                onPressProfile={() => handleTabChange('profile')}
                onPressLogout={handleLogout}
                onPressSwitchAccount={handleSwitchAccount}
                onPressUserManagement={() => handleTabChange('users')}
                onPressChangePassword={() => setShowChangePassword(true)}
              />
            ) : (
              <DesksScreen
                accessToken={session.access_token}
                userRole={session.user.role}
                initialAvailabilityContext={deskAvailabilityContext}
                selectedWorkArea={selectedWorkArea}
                onBackToWorkAreas={handleBackToWorkAreas}
                onPressReservations={() => handleTabChange('reservations')}
                onPressPayments={() => handleTabChange('payments')}
                onPressProfile={() => handleTabChange('profile')}
                onPressLogout={handleLogout}
                externalRefreshKey={desksRefreshKey}
                onPressSwitchAccount={handleSwitchAccount}
                onPressUserManagement={() => handleTabChange('users')}
                onPressChangePassword={() => setShowChangePassword(true)}
                onReservationCreated={() => {
                  setReservationsRefreshKey((current) => current + 1);
                  setPaymentsRefreshKey((current) => current + 1);
                }}
              />
            )}
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('reservations') ? (
          <AnimatedTabScreen isActive={activeTab === 'reservations'}>
            <MyReservationsScreen
              accessToken={session.access_token}
              userRole={session.user.role}
              refreshKey={reservationsRefreshKey}
              onPressDesks={handlePressDesks}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
              onPressChangePassword={() => setShowChangePassword(true)}
              onReservationCancelled={() => {
                setDesksRefreshKey((current) => current + 1);
                setProfileRefreshKey((current) => current + 1);
              }}
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('payments') ? (
          <AnimatedTabScreen isActive={activeTab === 'payments'}>
            <PaymentsScreen
              accessToken={session.access_token}
              userRole={session?.user.role}
              refreshKey={paymentsRefreshKey}
              onPressDesks={handlePressDesks}
              onPressReservations={() => handleTabChange('reservations')}
              onPressSettings={() => handleTabChange('settings')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
              onPressChangePassword={() => setShowChangePassword(true)}
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('settings') ? (
          <AnimatedTabScreen isActive={activeTab === 'settings'}>
            <DeskSettingsScreen
              accessToken={session.access_token}
              userRole={session.user.role}
              onPressDesks={handlePressDesks}
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
              onPressChangePassword={() => setShowChangePassword(true)}
              onDeskCreated={() => setDesksRefreshKey((current) => current + 1)}
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('profile') ? (
          <AnimatedTabScreen isActive={activeTab === 'profile'}>
            <ProfileScreen
              accessToken={session.access_token}
              initialUser={session.user}
              userRole={session.user.role}
              penaltiesRefreshKey={profileRefreshKey}
              onPressDesks={handlePressDesks}
              onPressReservations={() => handleTabChange('reservations')}
              onPressProfile={() => handleTabChange('profile')}
              onPressPayments={() => handleTabChange('payments')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
              onPressAdminCatalog={() => handleTabChange('catalog')}
              onPressChangePassword={() => setShowChangePassword(true)}
            />
          </AnimatedTabScreen>
        ) : null}

        {session?.user.role === 'ADMIN' && mountedTabs.has('users') ? (
          <AnimatedTabScreen isActive={activeTab === 'users'}>
            <UserManagementScreen
              accessToken={session.access_token}
              currentUserId={session.user.id}
              onPressDesks={handlePressDesks}
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
              onPressAdminCatalog={() => handleTabChange('catalog')}
              onPressChangePassword={() => setShowChangePassword(true)}
            />
          </AnimatedTabScreen>
        ) : null}

        {session?.user.role === 'ADMIN' && mountedTabs.has('catalog') ? (
          <AnimatedTabScreen isActive={activeTab === 'catalog'}>
            <AdminCatalogScreen
              accessToken={session.access_token}
              onPressAdminCatalog={() => handleTabChange('catalog')}
              onPressUserManagement={() => handleTabChange('users')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressChangePassword={() => setShowChangePassword(true)}
            />
          </AnimatedTabScreen>
        ) : null}
      </View>
      {session ? (
        <ChangePasswordModal
          visible={showChangePassword}
          accessToken={session.access_token}
          onClose={() => setShowChangePassword(false)}
          onPasswordChanged={() => {
            void endSession({
              title: 'Contraseña actualizada',
              description:
                'Ingrese nuevamente con su nueva contraseña para continuar.',
            });
          }}
        />
      ) : null}
      <StatusModal
        visible={Boolean(sessionError)}
        type="error"
        title={sessionError?.title ?? ''}
        description={sessionError?.description}
        onClose={() => setSessionError(undefined)}
      />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  restoringSession: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
