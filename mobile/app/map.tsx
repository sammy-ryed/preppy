import { SoundPressable as Pressable } from '../components/learning/SoundPressable';
import { useEffect, useRef } from 'react';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  type ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JourneyHeader } from '../components/learning/JourneyHeader';
import { BimboJourney } from '../components/learning/BimboJourney';
import { useCampaignProgress } from '../hooks/useCampaignProgress';
import { useLearningApplication } from '../providers/LearningProvider';
import { CURRICULUM_ID } from '../data/curriculum';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Map geometry
// map_bg.png has an approximate height/width ratio of 2.6.
// Tweak MAP_RATIO if nodes look misaligned on a real device.
// ─────────────────────────────────────────────────────────────────────────────
const MAP_RATIO = 2.6;
const MAP_H     = SCREEN_W * MAP_RATIO;
const NODE_SIZE = 75;   // px — circular level badge
const BMO_SIZE  = 88;   // px — BMO character

// The shared header is outside the map; no artwork inset is needed.


// ─────────────────────────────────────────────────────────────────────────────
// Static image registry — RN requires static require() paths
// ─────────────────────────────────────────────────────────────────────────────
const COLOURED: Record<number, ImageSourcePropType> = {
  1:  require('../assets/1.png'),
  2:  require('../assets/2.png'),
  3:  require('../assets/3.png'),
  4:  require('../assets/4.png'),
  5:  require('../assets/5.png'),
  6:  require('../assets/6.png'),
  7:  require('../assets/7.png'),
  8:  require('../assets/8.png'),
  9:  require('../assets/9.png'),
  10: require('../assets/10.png'),
  11: require('../assets/11.png'),
  12: require('../assets/12.png'),
  13: require('../assets/13.png'),
  14: require('../assets/14.png'),
  15: require('../assets/15.png'),
};

const BLACK: Record<number, ImageSourcePropType> = {
  1:  require('../assets/1_black.png'),
  2:  require('../assets/2_black.png'),
  3:  require('../assets/3_black.png'),
  4:  require('../assets/4_black.png'),
  5:  require('../assets/5_black.png'),
  6:  require('../assets/6_black.png'),
  7:  require('../assets/7_black.png'),
  8:  require('../assets/8_black.png'),
  9:  require('../assets/9_black.png'),
  10: require('../assets/10_black.png'),
  11: require('../assets/11_black.png'),
  12: require('../assets/12_black.png'),
  13: require('../assets/13_black.png'),
  14: require('../assets/14_black.png'),
  15: require('../assets/15_black.png'),
};

const BMO_COL = [
  require('../assets/bmo1.png'),
  require('../assets/bmo2.png'),
  require('../assets/bmo3.png'),
];

const BMO_BLK = [
  require('../assets/bmo1_black.png'),
  require('../assets/bmo2_black.png'),
  require('../assets/bmo3_black.png'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Node & BMO positions
// topFrac  → fraction of MAP_H from the top of the image.
// leftFrac → fraction of SCREEN_W from the left edge.
// ─────────────────────────────────────────────────────────────────────────────
type NodePos = { num: number; topFrac: number; leftFrac: number };
type BmoPos  = { idx: 0 | 1 | 2; topFrac: number; leftFrac: number; afterNode: number };

// Region 1 — Candy / grassland  : nodes 1–5
// Region 2 — Pink cloud land    : nodes 6–10
// Region 3 — Iceland / snow top : nodes 11–15
const NODE_POSITIONS: NodePos[] = [
  { num: 1,  topFrac: 0.908, leftFrac: 0.17 },
  { num: 2,  topFrac: 0.850, leftFrac: 0.37 },
  { num: 3,  topFrac: 0.793, leftFrac: 0.15 },
  { num: 4,  topFrac: 0.742, leftFrac: 0.47 },
  { num: 5,  topFrac: 0.692, leftFrac: 0.58 },
  { num: 6,  topFrac: 0.586, leftFrac: 0.53 },
  { num: 7,  topFrac: 0.546, leftFrac: 0.31 },
  { num: 8,  topFrac: 0.505, leftFrac: 0.53 },
  { num: 9,  topFrac: 0.463, leftFrac: 0.38 },
  { num: 10, topFrac: 0.420, leftFrac: 0.49 },
  { num: 11, topFrac: 0.330, leftFrac: 0.22 },
  { num: 12, topFrac: 0.278, leftFrac: 0.30 },
  { num: 13, topFrac: 0.224, leftFrac: 0.45 },
  { num: 14, topFrac: 0.172, leftFrac: 0.33 },
  { num: 15, topFrac: 0.118, leftFrac: 0.50 },
];

const BMO_POSITIONS: BmoPos[] = [
  { idx: 0, topFrac: 0.638, leftFrac: 0.28, afterNode: 5  },
  { idx: 1, topFrac: 0.374, leftFrac: 0.24, afterNode: 10 },
  { idx: 2, topFrac: 0.062, leftFrac: 0.43, afterNode: 15 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded button hit-areas on head_bar.png
// Expressed as fractions of the NAV bar's rendered width (SCREEN_W) and NAV_H.
//
// From the head_bar screenshot:
//   • home_button  → far-left rounded square  (~0–18% of width)
//   • badges_button → far-right pill          (~68–100% of width)
//
// The overlaid button images are absolutely positioned inside the nav bar View.
// ─────────────────────────────────────────────────────────────────────────────

// badges_button.png: right side, width ~30% of bar


// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router    = useRouter();
  const insets = useSafeAreaInsets();
  const NAV_H = insets.top + 12 + Math.min(SCREEN_W - 24, 560) * 736 / 2137 * 0.62;
  const { completedNodeId, transitionId } = useLocalSearchParams<{ completedNodeId?: string; transitionId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const progress  = useCampaignProgress();
  const { application, state } = useLearningApplication();


  const needsFullJourney = progress.status === 'ready' && progress.campaign?.id !== CURRICULUM_ID;
  useEffect(() => {
    if (needsFullJourney && !state.submittingOnboarding && !state.error) {
      void application.selectCampaign(CURRICULUM_ID);
    }
  }, [application, needsFullJourney, state.submittingOnboarding, state.error, state.saves]);

  const target = progress.nodes.find(node => node.id === progress.currentNodeId);
  const origin = progress.nodes.find(node => node.id === completedNodeId && node.status === 'completed');
  const position = (order: number) => {
    const point = NODE_POSITIONS.find(item => item.num === order)!;
    const size = order === 1 ? NODE_SIZE * 1.5 : NODE_SIZE;
    return { x: SCREEN_W * point.leftFrac + size * 0.15, y: NAV_H + MAP_H * point.topFrac - size / 2 - 22 };
  };
  const destination = target ? position(target.order) : null;
  const departure = origin && target && target.order === origin.order + 1 ? position(origin.order) : undefined;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination) scrollRef.current?.scrollTo({ y: Math.max(0, destination.y - Dimensions.get('window').height * 0.52), animated: false });
      else scrollRef.current?.scrollToEnd({ animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [destination?.y, progress.loading, needsFullJourney]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth/Loading gates ─────────────────────────────────────
  if (progress.status === 'needs_onboarding') {
    return <Redirect href="/onboarding" />;
  }

  if (progress.loading || (needsFullJourney && !state.error)) {
    return (
      <View style={[styles.gate, styles.center]}>
        <ActivityIndicator size="large" color="#3A7BD5" />
        <Text style={styles.gateText}>Loading your journey…</Text>
      </View>
    );
  }

  if (progress.status === 'error' || (needsFullJourney && state.error)) {
    return (
      <View style={[styles.gate, styles.center]}>
        <Text style={styles.errorText}>{progress.error ?? 'Something went wrong.'}</Text>
        <Pressable style={styles.retryBtn} onPress={() => needsFullJourney ? void application.selectCampaign(CURRICULUM_ID) : void progress.retry()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── Helpers ───────────────────────────────────────────────
  const getStatus = (num: number): 'completed' | 'available' | 'locked' =>
    progress.nodes.find(node => node.order === num)?.status ?? 'locked';

  const bmoUnlocked = (afterNode: number): boolean => {
    const stage = afterNode === 5 ? 'break1' : afterNode === 10 ? 'break2' : 'finalBoss';
    const checkpoint = progress.checkpoints.find(item => item.stage === stage);
    return Boolean(checkpoint && checkpoint.status !== 'locked');
  };

  const onNodePress = (num: number) => {
    const node = progress.nodes.find(item => item.order === num);
    if (!node || node.status === 'locked') return;
    router.push(
      { pathname: '/quest/[nodeId]', params: { nodeId: node.id } },
    );
  };

  const onBmoPress = (idx: number) => {
    const checkpoint = progress.checkpoints.find(item => item.stage === ['break1', 'break2', 'finalBoss'][idx]);
    if (!checkpoint || checkpoint.status === 'locked') return;
    router.push({
      pathname: '/game/[checkpointId]',
      params: { checkpointId: checkpoint.id },
    });
  };

  // Nav bar is pinned to the very top of the screen (top: 0).
  // Map content is pushed down by NAV_H so nothing hides underneath it.
  const navBarH = NAV_H;

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* ── Scrollable map ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={[styles.content, { height: NAV_H + MAP_H }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Background — offset by nav height so it aligns with scrollable content */}
        <Image
          source={require('../assets/map_bg.png')}
          style={[styles.mapBg, { top: 0, height: NAV_H + MAP_H }]}
          resizeMode="stretch"
        />

        {/* ── Level nodes (1–15) ── */}
        {NODE_POSITIONS.map(({ num, topFrac, leftFrac }) => {
          const status   = getStatus(num);
          const isLocked = status === 'locked';
          const src      = isLocked ? BLACK[num] : COLOURED[num];
          const node = progress.nodes.find(item => item.order === num);
          const stars = node?.stars ?? 0;
          const size     = num === 1 ? NODE_SIZE * 1.5 : NODE_SIZE;

          return (
            <Pressable
              key={`node-${num}`}
              style={[
                styles.nodeBtn,
                {
                  top:  navBarH + MAP_H * topFrac  - size / 2,
                  left: SCREEN_W * leftFrac - size / 2,
                  width: size,
                  height: size,
                },
              ]}
              onPress={() => onNodePress(num)}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel={`Level ${num}${isLocked ? ' — locked' : ''}`}
              accessibilityState={{ disabled: isLocked }}
            >
              {/* Clip the baked-in gold stars; the rating below reflects saved scores. */}
              <View style={{ height: size * 0.65, overflow: 'hidden' }}>
                <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />
              </View>
              <View style={[styles.nodeStars, { top: size * 0.63, height: size * 0.27, backgroundColor: isLocked ? '#DADDE1' : '#FFF0C5' }]}
                accessibilityLabel={`${stars} of 3 stars${status === 'completed' ? '' : ', not completed'}`}>
                {[1, 2, 3].map(star => <Text key={star} style={{ fontSize: size * 0.23, lineHeight: size * 0.27, color: star <= stars ? '#E7A600' : '#8B929A' }}>{star <= stars ? '★' : '☆'}</Text>)}
              </View>
            </Pressable>
          );
        })}

        {/* ── BMO checkpoints ── */}
        {BMO_POSITIONS.map(({ idx, topFrac, leftFrac, afterNode }) => {
          const unlocked = bmoUnlocked(afterNode);
          const src      = unlocked ? BMO_COL[idx] : BMO_BLK[idx];

          return (
            <Pressable
              key={`bmo-${idx}`}
              style={[
                styles.bmoBtn,
                {
                  top:  navBarH + MAP_H * topFrac  - BMO_SIZE / 2,
                  left: SCREEN_W * leftFrac - BMO_SIZE / 2,
                  width: BMO_SIZE,
                  height: BMO_SIZE,
                },
              ]}
              onPress={() => onBmoPress(idx)}
              disabled={!unlocked}
              accessibilityState={{ disabled: !unlocked }}
              accessibilityRole="button"
              accessibilityLabel={`BMO checkpoint ${idx + 1}`}
            >
              <Image source={src} style={styles.bmoImg} resizeMode="contain" />
            </Pressable>
          );
        })}
        {destination && <BimboJourney key={`${completedNodeId ?? ''}:${target?.id}`} from={departure} to={destination} transitionId={transitionId} />}
      </ScrollView>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
          <JourneyHeader />
        </View>



    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Outer shell — fills the whole screen
  screen: { flex: 1, backgroundColor: '#57BEFE' },

  // Scrollable map area — sits behind the nav bar
  root: { flex: 1 },
  // Exactly NAV_H + MAP_H so the scroll stops flush with the
  // bottom edge of map_bg.png — no blue gap below the image.
  content: {
    width: SCREEN_W,
    height: MAP_H,
    position: 'relative',
  },

  // Full-bleed background image — offset by nav height so it aligns with content
  mapBg: {
    position: 'absolute',
    left: 0,
    width: SCREEN_W,
    height: MAP_H,
  },

  // Node / BMO buttons are absolutely positioned in the scroll content
  nodeBtn: { position: 'absolute' },
  nodeImg: { width: '100%', height: '100%' },
  nodeStars: { position: 'absolute', left: '9%', width: '82%', borderRadius: 12, borderWidth: 1, borderColor: '#B99D76', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 },
  currentMarker: { position: 'absolute', alignItems: 'center', zIndex: 5 },
  bimboCrop: { width: 40, height: 35, overflow: 'hidden' },
  currentBimbo: { position: 'absolute', width: 62, height: 68, left: -11, top: -17 },
  markerArrow: { color: '#177D79', fontSize: 13, lineHeight: 14 },
  bmoBtn:  { position: 'absolute' },
  bmoImg:  { width: '100%', height: '100%' },

  // ── Sticky nav bar ────────────────────────────────────────
  // Loading / error gates
  gate:     { flex: 1, backgroundColor: '#F0F4FF' },
  center:   { alignItems: 'center', justifyContent: 'center', gap: 16 },
  gateText: { fontSize: 15, color: '#555', fontFamily: 'InstrumentSans_400Regular' },
  errorText: {
    fontSize: 15, color: '#b00020', textAlign: 'center',
    paddingHorizontal: 32, fontFamily: 'InstrumentSans_400Regular',
  },
  retryBtn: {
    backgroundColor: '#3A7BD5',
    paddingVertical: 10, paddingHorizontal: 28, borderRadius: 20,
  },
  retryBtnText: { color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15 },
});
