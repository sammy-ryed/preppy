import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

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
// Questions
// ─────────────────────────────────────────────────────────────
type Question = {
  question: string;
  options: string[];
  subline?: string;
};

const QUESTIONS: Question[] = [
  {
    question: "How's your aptitude?",
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    question: "How's your DSA?",
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    question: 'What company?',
    options: ['Google', 'OpenAI', 'JPMorgan'],
    subline: 'more to come...',
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// Option chip
// ─────────────────────────────────────────────────────────────
function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.optionChip, selected && styles.optionChipSelected, chipStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
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

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        if (!disabled) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null]);

  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardTranslateX.value }],
    opacity: cardOpacity.value,
  }));

  const animateTransition = (direction: 'forward' | 'back', callback: () => void) => {
    const outDir = direction === 'forward' ? -50 : 50;
    const inDir  = direction === 'forward' ?  50 : -50;

    // Slide + fade out
    cardTranslateX.value = withTiming(outDir, { duration: 160, easing: Easing.out(Easing.quad) });
    cardOpacity.value    = withTiming(0, { duration: 160 });

    setTimeout(() => {
      // Jump to opposite side, update content, then slide in
      cardTranslateX.value = inDir;
      callback();
      cardTranslateX.value = withSpring(0, { damping: 22, stiffness: 220 });
      cardOpacity.value    = withTiming(1, { duration: 200 });
    }, 170);
  };

  const handleSelect = (option: string) => {
    const next = [...answers];
    next[step] = option;
    setAnswers(next);
  };

  const handleNext = () => {
    if (step < 2) {
      animateTransition('forward', () => setStep((s) => s + 1));
    } else {
      router.replace('/map');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition('back', () => setStep((s) => s - 1));
    }
  };

  const q = QUESTIONS[step];
  const selected = answers[step];
  const canProceed = selected !== null;

  return (
    <View style={styles.root}>
      {/* Clouds */}
      {CLOUDS.map((c) => (
        <Cloud key={c.id} config={c} />
      ))}

      {/* Progress bars */}
      <View style={styles.progressRow}>
        {QUESTIONS.map((_, i) => (
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
        <NavButton label="← Back" onPress={handleBack} disabled={step === 0} variant="back" />
        <NavButton
          label={step === 2 ? 'Done ✓' : 'Next →'}
          onPress={handleNext}
          disabled={!canProceed}
          variant="next"
        />
      </View>

      {/* Question card */}
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.stepLabel}>{step + 1} of {QUESTIONS.length}</Text>
          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.optionsContainer}>
            {q.options.map((opt) => (
              <OptionChip
                key={opt}
                label={opt}
                selected={selected === opt}
                onPress={() => handleSelect(opt)}
              />
            ))}
          </View>

          {q.subline && (
            <Text style={styles.subline}>{q.subline}</Text>
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
  cloud: {
    position: 'absolute',
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
    marginBottom: 26,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(10,40,100,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    marginTop: 16,
    letterSpacing: 0.3,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
