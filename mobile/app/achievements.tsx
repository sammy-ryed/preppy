import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function AchievementsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Achievements</Text>
      <Text>Achievement cards will appear here when domain data is connected.</Text>
      <Link href="/map" dismissTo>Return to map</Link>
    </ScrollView>
  );
}
