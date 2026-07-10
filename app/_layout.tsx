import '../global.css';

import { Slot } from 'expo-router';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Oculta las advertencias del modo estricto de Reanimated en la terminal
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  return <Slot />;
}