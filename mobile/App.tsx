import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DeskSettingsScreen } from './src/features/desks/screens/DeskSettingsScreen';
import { DesksScreen } from './src/features/desks/screens/DesksScreen';
import { MyReservationsScreen } from './src/features/reservations/screens/MyReservationsScreen';
import { AuthScreen } from './src/features/auth/screens/AuthScreen';
import { LoginResponse } from './src/features/auth/types/auth.types';

type AppTab = 'desks' | 'reservations' | 'settings';

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
  const [activeTab, setActiveTab] = useState<AppTab>('desks');
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(
    () => new Set(['desks']),
  );
  const [reservationsRefreshKey, setReservationsRefreshKey] = useState(0);

  const handleTabChange = (tab: AppTab) => {
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

  const handleLogout = () => {
    setSession(null);
    setActiveTab('desks');
    setMountedTabs(new Set(['desks']));
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {!session ? (
          <AuthScreen onAuthenticated={setSession} />
        ) : mountedTabs.has('desks') ? (
          <AnimatedTabScreen isActive={activeTab === 'desks'}>
            <DesksScreen
              onPressReservations={() => handleTabChange('reservations')}
              onPressSettings={() => handleTabChange('settings')}
              onPressLogout={handleLogout}
              onReservationCreated={() =>
                setReservationsRefreshKey((current) => current + 1)
              }
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('reservations') ? (
          <AnimatedTabScreen isActive={activeTab === 'reservations'}>
            <MyReservationsScreen
              refreshKey={reservationsRefreshKey}
              onPressDesks={() => handleTabChange('desks')}
              onPressSettings={() => handleTabChange('settings')}
              onPressLogout={handleLogout}
            />
          </AnimatedTabScreen>
        ) : null}

        {session && mountedTabs.has('settings') ? (
          <AnimatedTabScreen isActive={activeTab === 'settings'}>
            <DeskSettingsScreen
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressLogout={handleLogout}
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
