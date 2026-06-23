import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, BackHandler, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DeskSettingsScreen } from './src/features/desks/screens/DeskSettingsScreen';
import { DesksScreen } from './src/features/desks/screens/DesksScreen';
import { PaymentsScreen } from './src/features/payments/screens/PaymentsScreen';
import { MyReservationsScreen } from './src/features/reservations/screens/MyReservationsScreen';

type AppTab = 'desks' | 'reservations' | 'payments' | 'settings';

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
  const [activeTab, setActiveTab] = useState<AppTab>('desks');
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(
    () => new Set(['desks']),
  );
  const [reservationsRefreshKey, setReservationsRefreshKey] = useState(0);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [desksRefreshKey, setDesksRefreshKey] = useState(0);

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
    BackHandler.exitApp();
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {mountedTabs.has('desks') ? (
          <AnimatedTabScreen isActive={activeTab === 'desks'}>
            <DesksScreen
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressSettings={() => handleTabChange('settings')}
              onPressLogout={handleLogout}
              externalRefreshKey={desksRefreshKey}
              onReservationCreated={() => {
                setReservationsRefreshKey((current) => current + 1);
                setPaymentsRefreshKey((current) => current + 1);
              }}
            />
          </AnimatedTabScreen>
        ) : null}

        {mountedTabs.has('reservations') ? (
          <AnimatedTabScreen isActive={activeTab === 'reservations'}>
            <MyReservationsScreen
              refreshKey={reservationsRefreshKey}
              onPressDesks={() => handleTabChange('desks')}
              onPressPayments={() => handleTabChange('payments')}
              onPressSettings={() => handleTabChange('settings')}
              onPressLogout={handleLogout}
              onReservationCancelled={() =>
                setDesksRefreshKey((current) => current + 1)
              }
            />
          </AnimatedTabScreen>
        ) : null}

        {mountedTabs.has('payments') ? (
          <AnimatedTabScreen isActive={activeTab === 'payments'}>
            <PaymentsScreen
              refreshKey={paymentsRefreshKey}
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressSettings={() => handleTabChange('settings')}
              onPressLogout={handleLogout}
            />
          </AnimatedTabScreen>
        ) : null}

        {mountedTabs.has('settings') ? (
          <AnimatedTabScreen isActive={activeTab === 'settings'}>
            <DeskSettingsScreen
              onPressDesks={() => handleTabChange('desks')}
              onPressReservations={() => handleTabChange('reservations')}
              onPressPayments={() => handleTabChange('payments')}
              onPressLogout={handleLogout}
              onDeskCreated={() => setDesksRefreshKey((current) => current + 1)}
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
