import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useOnboarding } from '../hooks/useOnboarding';
import type { SelfAssessedLevel } from '../types/content';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Cloud config
// ─────────────────────────────────────────────────────────────
type CloudConfig = {
  id: number;
  initialX: number;
  top: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
};

const CLOUDS: CloudConfig[] = [
  { id: 1, initialX: -260, top: 40,  width: 240, height: 100, duration: 28000, delay: 0 },
  { id: 2, initialX: -180, top: 110, width: 170, height: 80,  duration: 35000, delay: 6000 },
  { id: 3, initialX: SCREEN_W * 0.25, top: 60, width: 200, height: 90, duration: 32000, delay: 2000 },
  { id: 4, initialX: -120, top: 155, width: 140, height: 65, duration: 40000, delay: 12000 },
];

// Travel distance — from initialX to just off-screen right
const TRAVEL = SCREEN_W + 300;

function Cloud({ config }: { config: CloudConfig }) {
  // translateX shifts from 0 → TRAVEL, then repeats from 0 (which maps back to initialX)
  const tx = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      tx.value = withRepeat(
        withTiming(TRAVEL, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1, // infinite
        false // don't reverse
      );
    }, config.delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          left: config.initialX,
          top: config.top,
          width: config.width,
          height: config.height,
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Image
        source={require('../assets/clouds_multiple.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Step definitions (driven by hook campaigns for step 3)
// ─────────────────────────────────────────────────────────────
type StepId = 'aptitude' | 'dsa' | 'campaign';

const STEPS: StepId[] = ['aptitude', 'dsa', 'campaign'];
const LEVEL_OPTIONS: SelfAssessedLevel[] = ['beginner', 'intermediate', 'advanced'];
const LEVEL_LABELS: Record<SelfAssessedLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// Option chip
// ─────────────────────────────────────────────────────────────
function OptionChip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    runOnUI(() => {
      'worklet';
      scale.value = withSpring(0.95, { damping: 18, stiffness: 300 });
    })();
  };

  const handlePressOut = () => {
    runOnUI(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    })();
  };

  return (
    <AnimatedPressable
      style={[styles.optionChip, selected && styles.optionChipSelected, chipStyle]}
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
    >
      <View style={[styles.optionDot, selected && styles.optionDotSelected]} />
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav button
// ─────────────────────────────────────────────────────────────
function NavButton({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant: 'back' | 'next';
}) {
  const scale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.35 : 1,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    runOnUI(() => {
      'worklet';
      scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
    })();
  };

  const handlePressOut = () => {
    if (disabled) return;
    runOnUI(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    })();
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.navBtn,
        variant === 'next' ? styles.navBtnNext : styles.navBtnBack,
        btnStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.navBtnText, variant === 'next' && styles.navBtnTextNext]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const onboarding = useOnboarding();

  const [step, setStep] = useState(0);
  const [name, setName]                       = useState('');
  const [aptitude, setAptitude]               = useState<SelfAssessedLevel | null>(null);
  const [dsa, setDsa]                         = useState<SelfAssessedLevel | null>(null);
  const [campaignId, setCampaignId]           = useState<string | null>(null);

  const cardTranslateX = useSharedValue(0);
  const cardOpacity    = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardTranslateX.value }],
    opacity: cardOpacity.value,
  }));

  const animateTransition = (direction: 'forward' | 'back', callback: () => void) => {
    const outDir = direction === 'forward' ? -50 : 50;
    const inDir  = direction === 'forward' ?  50 : -50;

    // Slide + fade out — worklet-safe assignments via runOnUI
    runOnUI(() => {
      'worklet';
      cardTranslateX.value = withTiming(outDir, { duration: 160, easing: Easing.out(Easing.quad) });
      cardOpacity.value    = withTiming(0, { duration: 160 });
    })();

    setTimeout(() => {
      callback();
      runOnUI(() => {
        'worklet';
        cardTranslateX.value = inDir;
        cardTranslateX.value = withSpring(0, { damping: 22, stiffness: 220 });
        cardOpacity.value    = withTiming(1, { duration: 200 });
      })();
    }, 170);
  };

  // Default campaign when campaigns load and none selected yet
  useEffect(() => {
    if (onboarding.campaigns.length > 0) {
      setCampaignId((prev) => prev ?? onboarding.campaigns[0].id);
    }
  }, [onboarding.campaigns]);

  // If we're already onboarded, push to map
  useEffect(() => {
    if (onboarding.status === 'ready') {
      router.replace('/map');
    }
  }, [onboarding.status, router]);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      animateTransition('forward', () => setStep((s) => s + 1));
    } else {
      // Final step — submit
      const trimmedName = name.trim();
      if (!aptitude || !dsa || !campaignId || trimmedName.length === 0) return;
      const accepted = await onboarding.submit({
        name: trimmedName,
        aptitudeLevel: aptitude,
        dsaLevel: dsa,
        campaignId,
      });
      if (accepted) router.replace('/map');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition('back', () => setStep((s) => s - 1));
    }
  };

  // Loading / error gate (before onboarding questions are shown)
  if (onboarding.loading) {
    return (
      <View style={[styles.root, styles.centred]}>
        {CLOUDS.map((c) => <Cloud key={c.id} config={c} />)}
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.gateText}>Loading…</Text>
      </View>
    );
  }

  if (onboarding.status === 'error' && !onboarding.submitting) {
    return (
      <View style={[styles.root, styles.centred]}>
        {CLOUDS.map((c) => <Cloud key={c.id} config={c} />)}
        <Text style={styles.errorText}>{onboarding.error ?? 'Something went wrong.'}</Text>
        <Pressable style={styles.retryBtn} onPress={onboarding.retry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const currentStep = STEPS[step];

  // Per-step canProceed logic
  const canProceed = (() => {
    if (currentStep === 'aptitude') return aptitude !== null;
    if (currentStep === 'dsa') return dsa !== null;
    // campaign step: need name + a campaign selected
    return name.trim().length > 0 && campaignId !== null;
  })();

  const isLastStep = step === STEPS.length - 1;
  const isSubmitting = onboarding.submitting;

  return (
    <View style={styles.root}>
      {/* Clouds */}
      {CLOUDS.map((c) => (
        <Cloud key={c.id} config={c} />
      ))}

      {/* Progress bars */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              i < step
                ? styles.progressBarDone
                : i === step
                ? styles.progressBarActive
                : styles.progressBarPending,
            ]}
          />
        ))}
      </View>

      {/* Nav buttons */}
      <View style={styles.navRow}>
        <NavButton label="← Back" onPress={handleBack} disabled={step === 0 || isSubmitting} variant="back" />
        <NavButton
          label={isSubmitting ? 'Saving…' : isLastStep ? 'Done ✓' : 'Next →'}
          onPress={handleNext}
          disabled={!canProceed || isSubmitting}
          variant="next"
        />
      </View>

      {/* Question card */}
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.stepLabel}>{step + 1} of {STEPS.length}</Text>

          {currentStep === 'aptitude' && (
            <>
              <Text style={styles.questionText}>How&apos;s your aptitude?</Text>
              <View style={styles.optionsContainer}>
                {LEVEL_OPTIONS.map((lvl) => (
                  <OptionChip
                    key={lvl}
                    label={LEVEL_LABELS[lvl]}
                    selected={aptitude === lvl}
                    onPress={() => setAptitude(lvl)}
                    disabled={isSubmitting}
                  />
                ))}
              </View>
            </>
          )}

          {currentStep === 'dsa' && (
            <>
              <Text style={styles.questionText}>How&apos;s your DSA?</Text>
              <View style={styles.optionsContainer}>
                {LEVEL_OPTIONS.map((lvl) => (
                  <OptionChip
                    key={lvl}
                    label={LEVEL_LABELS[lvl]}
                    selected={dsa === lvl}
                    onPress={() => setDsa(lvl)}
                    disabled={isSubmitting}
                  />
                ))}
              </View>
            </>
          )}

          {currentStep === 'campaign' && (
            <>
              <Text style={styles.questionText}>What&apos;s your name?</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={name}
                onChangeText={setName}
                maxLength={60}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
              <Text style={[styles.questionText, { marginTop: 20 }]}>Pick your path</Text>
              <View style={styles.optionsContainer}>
                {onboarding.campaigns.map((c) => (
                  <OptionChip
                    key={c.id}
                    label={c.title ?? c.id}
                    selected={campaignId === c.id}
                    onPress={() => setCampaignId(c.id)}
                    disabled={isSubmitting}
                  />
                ))}
                <Text style={styles.subline}>more campaigns coming soon…</Text>
              </View>
            </>
          )}

          {/* Saving error with retry */}
          {onboarding.error && onboarding.status === 'error' && (
            <View style={styles.errorRow}>
              <Text style={styles.inlineError}>{onboarding.error}</Text>
              <Pressable onPress={onboarding.retry}>
                <Text style={styles.inlineRetry}>Try again</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const SKY_BLUE = '#3A7BD5';
const SKY_DARK = '#2563B8';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SKY_BLUE,
  },
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cloud: {
    position: 'absolute',
  },

  // Gate screens
  gateText: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  errorText: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 15,
    color: '#FFD0D0',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  retryBtnText: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Progress bars
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 58,
    gap: 8,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressBarDone: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  progressBarActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
  progressBarPending: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Nav row
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 14,
    zIndex: 10,
  },
  navBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  navBtnBack: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  navBtnNext: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1a3a6a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  navBtnText: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  navBtnTextNext: {
    color: SKY_DARK,
  },

  // Card
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 72,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.38)',
    shadowColor: '#0a2050',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  stepLabel: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  questionText: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: 16,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(10,40,100,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Name input
  nameInput: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  // Options
  optionsContainer: {
    gap: 11,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    gap: 14,
  },
  optionChipSelected: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#FFFFFF',
    shadowColor: '#1a3a6a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  optionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'transparent',
  },
  optionDotSelected: {
    backgroundColor: SKY_BLUE,
    borderColor: SKY_BLUE,
  },
  optionText: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 17,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.2,
  },
  optionTextSelected: {
    color: SKY_DARK,
  },

  // Subline
  subline: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.48)',
    marginTop: 4,
    letterSpacing: 0.3,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Inline error
  errorRow: {
    marginTop: 16,
    gap: 6,
    alignItems: 'center',
  },
  inlineError: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 13,
    color: '#FFD0D0',
    textAlign: 'center',
  },
  inlineRetry: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
