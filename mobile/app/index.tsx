import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnUI,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SplashScreen() {
  const router = useRouter();

  // Entrance: text block fades + slides up from below
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(40);

  // Button entrance (delayed)
  const btnOpacity = useSharedValue(0);
  const btnTranslateY = useSharedValue(30);

  // Button press scale
  const btnScale = useSharedValue(1);

  useEffect(() => {
    // Text block entrance
    textOpacity.value = withTiming(1, { duration: 800 });
    textTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 });

    // Button entrance, slightly delayed
    const timeout = setTimeout(() => {
      btnOpacity.value = withTiming(1, { duration: 600 });
      btnTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 });
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [
      { translateY: btnTranslateY.value },
      { scale: btnScale.value },
    ],
  }));

  const handlePressIn = () => {
    runOnUI(() => {
      'worklet';
      btnScale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
    })();
  };

  const handlePressOut = () => {
    runOnUI(() => {
      'worklet';
      btnScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    })();
  };

  const handlePress = () => {
    router.push('/onboarding');
  };

  return (
    <ImageBackground
      source={require('../assets/main_screen.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Overlay so text is legible against the bright sky */}
      <View style={styles.overlay} />

      {/* Title block — upper-centre area, clear sky region */}
      <Animated.View style={[styles.titleBlock, textAnimStyle]}>
        <Text style={styles.title}>Preppy</Text>
        <Text style={styles.subtitle}>Reach your dream company</Text>
      </Animated.View>

      {/* START button pinned to bottom */}
      <View style={styles.btnContainer}>
        <AnimatedPressable
          style={[styles.btn, btnAnimStyle]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Start your adventure"
        >
          <Text style={styles.btnText}>START</Text>
        </AnimatedPressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Gentle gradient-like white tint over the sky so white text pops
  overlay: {
    ...StyleSheet.absoluteFill,
    // Top portion only — tints the sky without killing the illustration
    backgroundColor: 'rgba(20, 60, 120, 0.18)',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '22%',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'BalooTamma2_800ExtraBold',
    fontSize: 72,
    color: '#FFFFFF',
    letterSpacing: 2,
    // Chunky drop shadow that matches the whimsical cartoon feel
    textShadowColor: 'rgba(0, 60, 40, 0.55)',
    textShadowOffset: { width: 3, height: 4 },
    textShadowRadius: 0,
    lineHeight: 80,
  },
  subtitle: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 18,
    color: '#F0FFF4',
    letterSpacing: 0.4,
    marginTop: 6,
    textShadowColor: 'rgba(0, 60, 40, 0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
  },
  btnContainer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 50,
    // Cartoon-style thick border
    borderWidth: 3,
    borderColor: '#1B4332',
    // Hard shadow for that adventure-game feel
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  btnText: {
    fontFamily: 'BalooTamma2_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
});
