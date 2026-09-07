import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function LevelScreen() {
  const { levelNum } = useLocalSearchParams<{ levelNum: string }>();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Level {levelNum}</Text>
      <Text style={styles.sub}>Content coming soon…</Text>
      <Pressable style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>← Back to Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#3A7BD5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontSize: 42,
    fontFamily: 'BalooTamma2_700Bold',
    color: '#FFFFFF',
  },
  sub: {
    fontSize: 16,
    fontFamily: 'InstrumentSans_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  btn: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  btnText: {
    fontSize: 16,
    fontFamily: 'InstrumentSans_600SemiBold',
    color: '#FFFFFF',
  },
});
