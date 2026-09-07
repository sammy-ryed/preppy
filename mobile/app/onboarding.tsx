import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function OnboardingScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Onboarding</Text>
      <Text>Name, DSA level, aptitude level, and target company will be collected here.</Text>
      <Link href="/map">Preview journey map</Link>
    </ScrollView>
  );
}
