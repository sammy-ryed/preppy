import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function SkillsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Skills</Text>
      <Text>Skill estimates and assessment evidence will appear here.</Text>
      <Link href="/map" dismissTo>Return to map</Link>
    </ScrollView>
  );
}
