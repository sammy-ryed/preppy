import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function OpeningScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Opening Screen</Text>
      <Text>Temporary routing scaffold. Visual implementation belongs to Valli.</Text>
      <Link href="/onboarding">Start</Link>
    </ScrollView>
  );
}
