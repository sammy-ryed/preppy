import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCampaignProgress } from '../hooks/useCampaignProgress';

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

// Height of the head_bar image as displayed (it's a horizontal bar, ~100px tall)
// Adjust NAV_H if your head_bar.png looks taller/shorter on device.
const NAV_H = 100;

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

// home_button.png: leftFrac 0, width 18% of bar, vertically centred in bar
const HOME_BTN = { left: 0, top: 4, width: SCREEN_W * 0.18, height: NAV_H - 8 };

// badges_button.png: right side, width ~30% of bar
const BADGES_BTN = {
  right: 0,
  top: 8,
  width: SCREEN_W * 0.30,
  height: NAV_H - 16,
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router    = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const progress  = useCampaignProgress();


  // Start the user at the bottom of the map (node 1 / START area)
  useEffect(() => {
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: false }),
      80,
    );
    return () => clearTimeout(t);
  }, []);

  // ── Auth/Loading gates ─────────────────────────────────────
  if (progress.status === 'needs_onboarding') {
    router.replace('/onboarding');
    return null;
  }

  if (progress.loading) {
    return (
      <View style={[styles.gate, styles.center]}>
        <ActivityIndicator size="large" color="#3A7BD5" />
        <Text style={styles.gateText}>Loading your journey…</Text>
      </View>
    );
  }

  if (progress.status === 'error') {
    return (
      <View style={[styles.gate, styles.center]}>
        <Text style={styles.errorText}>{progress.error ?? 'Something went wrong.'}</Text>
        <Pressable style={styles.retryBtn} onPress={progress.retry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── Helpers ───────────────────────────────────────────────
  const getStatus = (num: number): 'completed' | 'available' | 'locked' =>
    progress.nodes[num - 1]?.status ?? 'locked';

  const bmoUnlocked = (afterNode: number): boolean => {
    for (let n = afterNode - 4; n <= afterNode; n++) {
      if (getStatus(n) !== 'completed') return false;
    }
    return true;
  };

  const onNodePress = (num: number) => {
    if (getStatus(num) === 'locked') return;
    router.push(
      { pathname: '/level/[levelNum]' as never, params: { levelNum: String(num) } },
    );
  };

  const onBmoPress = (idx: number) => {
    router.push({
      pathname: '/game/[checkpointId]',
      params: { checkpointId: `bmo${idx + 1}` },
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Background — offset by nav height so it aligns with scrollable content */}
        <Image
          source={require('../assets/map_bg.png')}
          style={[styles.mapBg, { top: navBarH }]}
          resizeMode="cover"
        />

        {/* ── Level nodes (1–15) ── */}
        {NODE_POSITIONS.map(({ num, topFrac, leftFrac }) => {
          const status   = getStatus(num);
          const isLocked = status === 'locked';
          const src      = isLocked ? BLACK[num] : COLOURED[num];
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
              <Image source={src} style={styles.nodeImg} resizeMode="contain" />
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
              accessibilityRole="button"
              accessibilityLabel={`BMO checkpoint ${idx + 1}`}
            >
              <Image source={src} style={styles.bmoImg} resizeMode="contain" />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Sticky nav bar — pinned to top: 0, floats above map ── */}
      <View
        pointerEvents="box-none"
        style={styles.navWrapper}
      >
        {/* head_bar.png is the visual — buttons are invisible regions on top */}
        <Image
          source={require('../assets/head_bar.png')}
          style={styles.navBgImg}
          resizeMode="contain"
        />

        {/* Invisible home hit-area — left side of bar */}
        <Pressable
          style={[styles.navHitArea, HOME_BTN]}
          onPress={() => router.push('/home' as never)}
          accessibilityRole="button"
          accessibilityLabel="Home"
        />

        {/* Invisible badges hit-area — right side of bar */}
        <Pressable
          style={[styles.navHitArea, BADGES_BTN]}
          onPress={() => router.push('/badges' as never)}
          accessibilityRole="button"
          accessibilityLabel="Badges"
        />

        {/* ── Progress bar placeholder (centre of bar) ──
            TODO: wire up dynamic fill value when ready — remind me! */}
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
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
    height: NAV_H + MAP_H,
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
  bmoBtn:  { position: 'absolute' },
  bmoImg:  { width: '100%', height: '100%' },

  // ── Sticky nav bar ────────────────────────────────────────
  navWrapper: {
    position: 'absolute',
    top: 0,          // pinned to the very top of the screen
    left: 0,
    right: 0,
    height: NAV_H,
    zIndex: 100,
  },
  // head_bar.png stretches full width
  navBgImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: NAV_H,
  },
  // Fully transparent hit-areas — no children, no background
  navHitArea: {
    position: 'absolute',
  },

  // Progress bar — centred inside the bar, overlaid on the BMO area
  // Position: roughly 52–72% from left, bottom 28% of bar height
  progressTrack: {
    position: 'absolute',
    left:   SCREEN_W * 0.36,
    right:  SCREEN_W * 0.22,
    bottom: NAV_H * 0.18,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,200,220,0.5)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#FF8DC7',
  },

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
