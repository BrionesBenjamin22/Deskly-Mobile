import { StatusBar } from 'expo-status-bar';

import { DesksScreen } from './src/features/desks/screens/DesksScreen';

export default function App() {
  return (
    <>
      <DesksScreen />
      <StatusBar style="dark" />
    </>
  );
}
