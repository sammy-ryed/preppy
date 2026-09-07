import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LearningProvider } from '../providers/LearningProvider';

// Shared routing shell. Screen presentation belongs to Valli.
export default function RootLayout() {
  return (
    <LearningProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'PREPPY' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
        <Stack.Screen name="map" options={{ title: 'Journey Map' }} />
        <Stack.Screen name="quest/[nodeId]" options={{ title: 'Quest' }} />
        <Stack.Screen name="game/[checkpointId]" options={{ title: 'Game' }} />
        <Stack.Screen name="skills" options={{ title: 'Skills' }} />
        <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
      </Stack>
    </LearningProvider>
  );
}
