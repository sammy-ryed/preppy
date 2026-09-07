import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function MapScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text>Journey Map</Text>
      <Text>Navigation previews only. Campaign data and progression are not implemented.</Text>
      <Link href={{ pathname: '/quest/[nodeId]', params: { nodeId: 'preview-node' } }}>
        Preview quest
      </Link>
      <Link href={{ pathname: '/game/[checkpointId]', params: { checkpointId: 'preview-checkpoint' } }}>
        Preview game screen
      </Link>
      <Link href="/skills">View skills</Link>
      <Link href="/achievements">View achievements</Link>
    </ScrollView>
  );
}
