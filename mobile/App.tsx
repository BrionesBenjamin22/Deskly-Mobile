import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DeskSettingsScreen } from './src/features/desks/screens/DeskSettingsScreen';
import { DesksScreen } from './src/features/desks/screens/DesksScreen';
import { MyReservationsScreen } from './src/features/reservations/screens/MyReservationsScreen';

type AppTab = 'desks' | 'reservations' | 'settings';

function ScreenTransition({ children }: PropsWithChildren) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, children]);

  return (
    <Animated.View
      style={[
        styles.screen,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
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

  return (
    <SafeAreaProvider>
      <ScreenTransition>
        {activeTab === 'desks' ? (
          <DesksScreen
            onPressReservations={() => setActiveTab('reservations')}
            onPressSettings={() => setActiveTab('settings')}
          />
        ) : null}

        {activeTab === 'reservations' ? (
          <MyReservationsScreen
            onPressDesks={() => setActiveTab('desks')}
            onPressSettings={() => setActiveTab('settings')}
          />
        ) : null}

        {activeTab === 'settings' ? (
          <DeskSettingsScreen
            onPressDesks={() => setActiveTab('desks')}
            onPressReservations={() => setActiveTab('reservations')}
          />
        ) : null}
      </ScreenTransition>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
