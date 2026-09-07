import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  BalooTamma2_400Regular,
  BalooTamma2_700Bold,
  BalooTamma2_800ExtraBold,
} from '@expo-google-fonts/baloo-tamma-2';
import {
  InstrumentSans_400Regular,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import { View } from 'react-native';

import { LearningProvider } from '../providers/LearningProvider';

// Shared routing shell. Screen presentation belongs to Valli.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BalooTamma2_400Regular,
    BalooTamma2_700Bold,
    BalooTamma2_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <LearningProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="map" />
        <Stack.Screen name="quest/[nodeId]" />
        <Stack.Screen name="game/[checkpointId]" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="achievements" />
      </Stack>
    </LearningProvider>
  );
}