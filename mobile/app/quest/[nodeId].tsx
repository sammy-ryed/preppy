import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function QuestScreen() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Quest</Text>
      <Text>Node: {nodeId}</Text>
      <Text>Learning content will connect here through Sammy&apos;s hooks.</Text>
      <Link href="/map" dismissTo>Return to map</Link>
    </ScrollView>
  );
}
