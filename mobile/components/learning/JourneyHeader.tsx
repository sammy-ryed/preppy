import { SoundPressable as Pressable } from './SoundPressable';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCampaignProgress } from '../../hooks/useCampaignProgress';
import { useBadges } from '../../hooks/useBadges';

// The artwork has transparent padding. Crop its display bounds so the pink bar
// fills the header without stretching Bimbo or leaving a large colored strip.
export function JourneyHeader({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useCampaignProgress();
  const earnedBadges = useBadges().badges.filter(badge => badge.earned);
  const barWidth = Math.min(width - 24, 560);
  const imageHeight = barWidth * 736 / 2137;
  const completed = progress.nodes.filter(node => node.status === 'completed').length;
  const percent = progress.nodes.length ? 100 * completed / progress.nodes.length : 0;
  return <View style={[s.header, { paddingTop: insets.top + (compact ? 0 : 4), paddingBottom: compact ? 0 : 8 }]}>
    <StatusBar style="dark" />
    <View style={{ width: barWidth, height: imageHeight * 0.62, overflow: 'hidden' }}>
      <Image source={require('../../assets/head_bar.png')} resizeMode="contain"
        style={{ position: 'absolute', top: -imageHeight * 0.18, width: barWidth, height: imageHeight }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Home — start screen" onPress={() => router.replace('/')}
        style={{ position: 'absolute', left: barWidth * 0.025, top: imageHeight * 0.1, width: barWidth * 0.15, height: Math.max(44, imageHeight * 0.36) }} />
      {earnedBadges.length > 0 && <View pointerEvents="none" accessible={false}
        style={{ position: 'absolute', left: barWidth * 0.689, top: imageHeight * 0.184, width: barWidth * 0.045, height: imageHeight * 0.18, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#A36308', fontSize: barWidth * 0.035, lineHeight: barWidth * 0.045 }}>★</Text>
      </View>}
      <View pointerEvents="none" accessible={false}
        style={{ position: 'absolute', left: barWidth * 0.783, top: imageHeight * 0.135, width: barWidth * 0.107, height: imageHeight * 0.255, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: barWidth * 0.04, lineHeight: barWidth * 0.048, color: '#63233F' }}>{earnedBadges.length}<Text style={{ color: '#A87886', fontSize: barWidth * 0.027 }}> / 5</Text></Text>
        <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: barWidth * 0.021, lineHeight: barWidth * 0.028, color: '#976778' }}>BADGES</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Badges, ${earnedBadges.length} of 5 collected`} onPress={() => router.push('/badges')}
        style={{ position: 'absolute', left: barWidth * 0.67, top: imageHeight * 0.1, width: barWidth * 0.30, height: Math.max(44, imageHeight * 0.36) }} />
      <View accessibilityRole="progressbar" accessibilityLabel="Journey completed" accessibilityValue={{ min: 0, max: progress.nodes.length, now: completed }}
        pointerEvents="none" style={[s.track, { left: barWidth * 0.438, top: imageHeight * 0.47, width: barWidth * 0.182, height: imageHeight * 0.066 }]}>
        <View style={[s.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  </View>;
}
const s = StyleSheet.create({
  // Stay in normal layout flow: scrolling content starts below the complete
  // safe-area/header height and cannot slide underneath its buttons or Bimbo.
  header: { alignItems: 'center', paddingBottom: 8, backgroundColor: 'transparent', flexShrink: 0 },
  track: { position: 'absolute', borderRadius: 12, backgroundColor: '#F9D5E1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 12, backgroundColor: '#FF8DC7' },
});
