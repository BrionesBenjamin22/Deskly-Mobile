import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DeskSettingsScreen } from './src/features/desks/screens/DeskSettingsScreen';
import { DesksScreen } from './src/features/desks/screens/DesksScreen';
import { PaymentsScreen } from './src/features/payments/screens/PaymentsScreen';
import { MyReservationsScreen } from './src/features/reservations/screens/MyReservationsScreen';
import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { ProfileScreen } from './src/features/auth/screens/ProfileScreen';
import { LoginResponse } from './src/features/auth/types/auth.types';
import { UserManagementScreen } from './src/features/users/screens/UserManagementScreen';

type AppTab = 'desks' | 'reservations' | 'payments' | 'settings' | 'profile' | 'users';

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
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback | undefined>();
  const [activeTab, setActiveTab] = useState<AppTab>('desks');
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(
    () => new Set(['desks']),
  );
  const [reservationsRefreshKey, setReservationsRefreshKey] = useState(0);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [desksRefreshKey, setDesksRefreshKey] = useState(0);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

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
  };

  const handleLogout = () => {
    resetSession({
      title: 'Sesión cerrada',
      description: 'Su sesión se cerró correctamente.',
    });
  };

  const handleSwitchAccount = () => {
    resetSession({
      title: 'Cambiar cuenta',
      description: 'Ingrese las credenciales de la cuenta que desea utilizar.',
    });
  };

  const handleAuthenticated = (nextSession: LoginResponse) => {
    setAuthFeedback(undefined);
    setSession(nextSession);
    if (nextSession.user.role === 'GESTOR') {
      setActiveTab('reservations');
      setMountedTabs(new Set(['reservations']));
    } else {
      setActiveTab('desks');
      setMountedTabs(new Set(['desks']));
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {!session ? (
          <AuthScreen
            onAuthenticated={handleAuthenticated}
            initialFeedback={authFeedback}
          />
        ) : mountedTabs.has('desks') ? (
          <AnimatedTabScreen isActive={activeTab === 'desks'}>
            <DesksScreen
              accessToken={session.access_token}
              userRole={session.user.role}
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              externalRefreshKey={desksRefreshKey}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
              onReservationCreated={() => {
                setReservationsRefreshKey((current) => current + 1);
                setPaymentsRefreshKey((current) => current + 1);
              }}
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('reservations') ? (
          <AnimatedTabScreen isActive={activeTab === 'reservations'}>
            <MyReservationsScreen
              accessToken={session.access_token}
              userRole={session.user.role}
              refreshKey={reservationsRefreshKey}
              onPressDesks={() => handleTabChange('desks')}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
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
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressSettings={() => handleTabChange('settings')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('settings') ? (
          <AnimatedTabScreen isActive={activeTab === 'settings'}>
            <DeskSettingsScreen
              userRole={session.user.role}
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
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
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressProfile={() => handleTabChange('profile')}
              onPressPayments={() => handleTabChange('payments')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
            />
          </AnimatedTabScreen>
        ) : null}

        {session?.user.role === 'ADMIN' && mountedTabs.has('users') ? (
          <AnimatedTabScreen isActive={activeTab === 'users'}>
            <UserManagementScreen
              accessToken={session.access_token}
              currentUserId={session.user.id}
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressProfile={() => handleTabChange('profile')}
              onPressLogout={handleLogout}
              onPressSwitchAccount={handleSwitchAccount}
              onPressUserManagement={() => handleTabChange('users')}
            />
          </AnimatedTabScreen>
        ) : null}
      </View>
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
});
