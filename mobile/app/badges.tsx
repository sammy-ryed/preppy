import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function BadgesScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Badges</Text>
      <Text style={styles.sub}>Your earned badges will appear here…</Text>
      <Pressable style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>← Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#F5C842',
    alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  title: { fontSize: 42, fontFamily: 'BalooTamma2_700Bold', color: '#5C3A00' },
  sub:   { fontSize: 16, fontFamily: 'InstrumentSans_400Regular', color: 'rgba(92,58,0,0.7)' },
  btn: {
    marginTop: 12, backgroundColor: 'rgba(92,58,0,0.15)',
    borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28,
    borderWidth: 1.5, borderColor: 'rgba(92,58,0,0.25)',
  },
  btnText: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#5C3A00' },
});
