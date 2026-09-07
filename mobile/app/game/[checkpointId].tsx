import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function GameScreen() {
  const { checkpointId } = useLocalSearchParams<{ checkpointId: string }>();

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Game</Text>
      <Text>Checkpoint: {checkpointId}</Text>
      <Text>Godot integration is not implemented in this scaffold.</Text>
      <Link href="/map" dismissTo>Return to map</Link>
    </ScrollView>
  );
}
