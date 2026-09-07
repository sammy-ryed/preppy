import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCampaignProgress } from '../hooks/useCampaignProgress';

const STATUS_ICON: Record<string, string> = {
  locked: '🔒',
  available: '⭐',
  completed: '✅',
};

const STATUS_LABEL: Record<string, string> = {
  locked: 'Locked',
  available: 'Start',
  completed: 'Done',
};

export default function MapScreen() {
  const router = useRouter();
  const progress = useCampaignProgress();

  // Route unauthenticated / not-yet-onboarded users
  if (progress.status === 'needs_onboarding') {
    router.replace('/onboarding');
    return null;
  }

  if (progress.loading) {
    return (
      <View style={[styles.root, styles.centred]}>
        <ActivityIndicator size="large" color="#3A7BD5" />
        <Text style={styles.gateText}>Loading your journey…</Text>
      </View>
    );
  }

  if (progress.status === 'error') {
    return (
      <View style={[styles.root, styles.centred]}>
        <Text style={styles.errorText}>{progress.error ?? 'Something went wrong.'}</Text>
        <Pressable style={styles.retryBtn} onPress={progress.retry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.campaignTitle}>
          {progress.campaign?.title ?? 'Your Journey'}
        </Text>
        <View style={styles.xpPill}>
          <Text style={styles.xpText}>⚡ {progress.xp} XP</Text>
        </View>
      </View>

      {progress.educationCompleted && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>🎉 All nodes completed!</Text>
        </View>
      )}

      {/* Node map */}
      <View style={styles.nodesSection}>
        <Text style={styles.sectionLabel}>NODES</Text>
        {progress.nodes.map((node) => {
          const isAvailable = node.status === 'available';
          const isLocked = node.status === 'locked';
          return (
            <Pressable
              key={node.id}
              style={[
                styles.nodeCard,
                isAvailable && styles.nodeCardAvailable,
                node.status === 'completed' && styles.nodeCardCompleted,
                isLocked && styles.nodeCardLocked,
              ]}
              onPress={() => {
                if (isAvailable) {
                  router.push({ pathname: '/quest/[nodeId]', params: { nodeId: node.id } });
                }
              }}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel={`${node.title} — ${STATUS_LABEL[node.status]}`}
              accessibilityState={{ disabled: isLocked }}
            >
              <Text style={styles.nodeIcon}>{STATUS_ICON[node.status]}</Text>
              <View style={styles.nodeInfo}>
                <Text style={[styles.nodeTitle, isLocked && styles.nodeTitleLocked]}>
                  {node.title}
                </Text>
                <Text style={[styles.nodeStatus, isLocked && styles.nodeStatusLocked]}>
                  {STATUS_LABEL[node.status]} · {node.baseXp} XP
                </Text>
              </View>
              {isAvailable && progress.currentNodeId === node.id && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Now</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Footer links */}
      <View style={styles.footer}>
        <Pressable
          style={styles.footerLink}
          onPress={() => router.push('/skills')}
          accessibilityRole="button"
        >
          <Text style={styles.footerLinkText}>📈 View Skills</Text>
        </Pressable>
        <Pressable
          style={styles.footerLink}
          onPress={() => router.push('/achievements')}
          accessibilityRole="button"
        >
          <Text style={styles.footerLinkText}>🏆 Achievements</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const BLUE = '#3A7BD5';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 48, gap: 20 },
  centred: { alignItems: 'center', justifyContent: 'center', gap: 16 },

  // Loading / error
  gateText: { fontSize: 15, color: '#555', fontFamily: 'InstrumentSans_400Regular' },
  errorText: {
    fontSize: 15, color: '#b00020', textAlign: 'center',
    paddingHorizontal: 32, fontFamily: 'InstrumentSans_400Regular',
  },
  retryBtn: {
    backgroundColor: BLUE, paddingVertical: 10, paddingHorizontal: 28,
    borderRadius: 20,
  },
  retryBtnText: { color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  campaignTitle: {
    fontFamily: 'BalooTamma2_700Bold', fontSize: 24, color: '#1a2a50', flex: 1,
  },
  xpPill: {
    backgroundColor: '#E8F0FF', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#C0CFF5',
  },
  xpText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: BLUE },

  // Completed banner
  completedBanner: {
    backgroundColor: '#D4EDDA', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#A8D5B5',
  },
  completedText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#1B6B35' },

  // Nodes
  nodesSection: { gap: 12 },
  sectionLabel: {
    fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11, color: '#8898BB',
    letterSpacing: 1.5, marginBottom: 4,
  },
  nodeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: '#E0E8F8',
    shadowColor: '#1a2a50', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  nodeCardAvailable: { borderColor: BLUE, backgroundColor: '#F5F8FF' },
  nodeCardCompleted: { borderColor: '#A8D5B5', backgroundColor: '#F0FFF4' },
  nodeCardLocked: { opacity: 0.55 },
  nodeIcon: { fontSize: 28 },
  nodeInfo: { flex: 1 },
  nodeTitle: {
    fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#1a2a50',
  },
  nodeTitleLocked: { color: '#8898BB' },
  nodeStatus: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#5570A0', marginTop: 2,
  },
  nodeStatusLocked: { color: '#AABBD0' },
  currentBadge: {
    backgroundColor: BLUE, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10,
  },
  currentBadgeText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 12, color: '#fff' },

  // Footer
  footer: { flexDirection: 'row', gap: 12 },
  footerLink: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E8F8',
    shadowColor: '#1a2a50', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  footerLinkText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#3A7BD5' },
});
