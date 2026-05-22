import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DesksScreen } from './src/features/desks/screens/DesksScreen';
import { MyReservationsScreen } from './src/features/reservations/screens/MyReservationsScreen';

type AppTab = 'desks' | 'reservations';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('desks');

  return (
    <SafeAreaProvider>
      {activeTab === 'desks' ? (
        <DesksScreen onPressReservations={() => setActiveTab('reservations')} />
      ) : (
        <MyReservationsScreen onPressDesks={() => setActiveTab('desks')} />
      )}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
