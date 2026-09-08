import { SoundPressable as Pressable } from '../learning/SoundPressable';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { CURRICULUM_ID } from '../../data/curriculum';
import { useOnboarding } from '../../hooks/useOnboarding';
import type { SelfAssessedLevel } from '../../types/content';
import { CloudSky } from './CloudSky';

const levels: { id: SelfAssessedLevel; label: string; aptitude: string; dsa: string }[] = [
  { id: 'beginner', label: 'Just setting off', aptitude: 'Build my number sense from the basics.', dsa: 'Get comfortable with arrays and the basics.' },
  { id: 'intermediate', label: 'Finding my stride', aptitude: 'I know the basics. Time for more practice.', dsa: 'I can solve familiar problems with some help.' },
  { id: 'advanced', label: 'Ready for a challenge', aptitude: 'Sharpen my reasoning on trickier problems.', dsa: 'Work on tougher patterns and efficiency.' },
];
const titles = ['How are your puzzle skills?', 'And your coding skills?', 'Your adventure starts here'];
const descriptions = ['Tell Bimbo how you feel about aptitude.', 'Tell Bimbo how you feel about DSA.', 'One little introduction before we set off.'];

export default function OnboardingScreen() {
  const onboarding = useOnboarding();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [aptitude, setAptitude] = useState<SelfAssessedLevel | null>(null);
  const [dsa, setDsa] = useState<SelfAssessedLevel | null>(null);
  const [name, setName] = useState('');
  const actionAt = useRef(0);
  const submitting = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const campaign = onboarding.campaigns.find(item => item.id === CURRICULUM_ID);
  const busy = onboarding.submitting;

  const back = useCallback(() => {
    if (busy || submitting.current) return;
    Keyboard.dismiss();
    if (step === 0) router.replace('/');
    else { setStep(value => Math.max(0, value - 1)); scroll.current?.scrollTo({ y: 0, animated: false }); }
  }, [busy, router, step]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => subscription.remove();
  }, [back]));

  const canContinue = !busy && (step === 0 ? Boolean(aptitude) : step === 1 ? Boolean(dsa) : Boolean(name.trim() && campaign));
  async function next() {
    if (!canContinue || submitting.current || Date.now() - actionAt.current < 350) return;
    actionAt.current = Date.now();
    Keyboard.dismiss();
    if (step < 2) { setStep(value => Math.min(2, value + 1)); scroll.current?.scrollTo({ y: 0, animated: false }); return; }
    if (!aptitude || !dsa || !campaign) return;
    submitting.current = true;
    try { await onboarding.submit({ name: name.trim(), aptitudeLevel: aptitude, dsaLevel: dsa, campaignId: campaign.id }); }
    finally { submitting.current = false; }
  }

  if (onboarding.status === 'ready') return <Redirect href="/map" />;
  const unavailable = onboarding.loading || onboarding.status === 'error';
  return <View style={s.screen}>
    <StatusBar style="dark" />
    <CloudSky />
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={s.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={step === 0 ? 'Back to start' : 'Previous step'} disabled={busy} onPress={back} style={({ pressed }) => [s.back, pressed && s.pressed, busy && s.disabled]}><Text style={s.backText}>← {step === 0 ? 'Home' : 'Back'}</Text></Pressable>
          <Text style={s.brand}>PREPPY</Text>
          <Text style={s.stepCount}>{step + 1} / 3</Text>
        </View>
        <View style={s.hero}>
          <Image source={require('../../assets/bmo1.png')} resizeMode="contain" style={s.bimbo} accessibilityLabel="Bimbo, your adventure buddy" />
          <View style={s.speech}><Text style={s.speechText}>Hey, adventurer!{ '\n' }Let’s find your footing.</Text></View>
        </View>
        <View style={s.trail} accessibilityLabel={`Setup step ${step + 1} of 3`}>
          {['Aptitude', 'DSA', 'Let’s go'].map((label, index) => <View key={label} style={s.stop}>
            <View style={[s.dot, index <= step && s.dotActive]}><Text style={s.dotText}>{index < step ? '✓' : index + 1}</Text></View>
            <Text style={[s.stopText, index === step && s.stopCurrent]}>{label}</Text>
          </View>)}
        </View>
        <Animated.View key={step} entering={reducedMotion ? undefined : FadeIn.duration(220)} style={s.card}>
          {unavailable ? <View style={s.gate}>
            <Text style={s.title}>{onboarding.loading ? 'Packing for your adventure…' : 'A little bump in the road'}</Text>
            {onboarding.loading ? <ActivityIndicator color="#9D3865" /> : <><Text accessibilityRole="alert" style={s.error}>{onboarding.error}</Text><Pressable accessibilityRole="button" onPress={() => void onboarding.retry()} style={s.primary}><Text style={s.primaryText}>Try again</Text></Pressable></>}
          </View> : <>
            <Text style={s.eyebrow}>{step === 2 ? 'MEET YOUR JOURNEY' : 'FIND YOUR FOOTING'}</Text>
            <Text accessibilityRole="header" style={s.title}>{titles[step]}</Text>
            <Text style={s.description}>{descriptions[step]}</Text>
            {step < 2 ? <View style={s.options} accessibilityRole="radiogroup">
              {levels.map((level, index) => {
                const selected = (step === 0 ? aptitude : dsa) === level.id;
                return <Pressable key={level.id} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: busy }} disabled={busy} onPress={() => step === 0 ? setAptitude(level.id) : setDsa(level.id)} style={({ pressed }) => [s.option, selected && s.selected, pressed && s.pressed]}>
                  <View style={[s.levelBadge, selected && s.selectedBadge]}><Text style={s.levelNumber}>{selected ? '✓' : `0${index + 1}`}</Text></View>
                  <View style={s.optionCopy}><Text style={s.optionTitle}>{level.label}</Text><Text style={s.optionDescription}>{step === 0 ? level.aptitude : level.dsa}</Text></View>
                </Pressable>;
              })}
              <Text style={s.note}>No pressure. This sets your starting skill estimate; everyone explores the same 15-node journey.</Text>
            </View> : <View style={s.options}>
              <Text style={s.label}>What should Bimbo call you?</Text>
              <TextInput accessibilityLabel="Your name" placeholder="Your name" placeholderTextColor="#8C7E85" value={name} onChangeText={setName} editable={!busy} maxLength={60} autoCapitalize="words" autoComplete="given-name" returnKeyType="done" onSubmitEditing={() => void next()} style={s.input} />
              <View style={s.journey}><Text style={s.optionTitle}>Your 15-node adventure</Text><Text style={s.optionDescription}>Aptitude + DSA at every stop. Learn, try a quiz, and watch your skills grow.</Text><View style={s.tags}><Text style={s.tag}>15 quests</Text><Text style={s.tag}>3 game breaks</Text><Text style={s.tag}>One Bimbo buddy</Text></View></View>
              {!campaign && <Text style={s.error}>The learning journey is unavailable. Go back to Home and try again.</Text>}
            </View>}
            {onboarding.error && <Text accessibilityRole="alert" style={s.error}>{onboarding.error}</Text>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canContinue, busy }} disabled={!canContinue} onPress={() => void next()} style={({ pressed }) => [s.primary, !canContinue && s.disabled, pressed && s.pressed]}>
              {busy ? <ActivityIndicator color="#60233F" /> : <><Text style={s.primaryText}>{step === 2 ? 'Start my adventure' : 'Next stop'}</Text><Text style={s.primaryText}>→</Text></>}
            </Pressable>
          </>}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, width: '100%', maxWidth: 540, alignSelf: 'center', flexGrow: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#FFF8EA', borderWidth: 1.5, borderColor: '#413547' },
  backText: { fontFamily: 'InstrumentSans_600SemiBold', color: '#413547', fontSize: 14 },
  brand: { fontFamily: 'BalooTamma2_800ExtraBold', color: '#283951', fontSize: 25, letterSpacing: 2 },
  stepCount: { fontFamily: 'InstrumentSans_600SemiBold', color: '#283951', fontSize: 14, minWidth: 45, textAlign: 'right' },
  hero: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8 },
  bimbo: { width: 106, height: 118 },
  speech: { padding: 14, borderRadius: 21, borderBottomLeftRadius: 4, backgroundColor: '#FFF8EA', borderWidth: 1.5, borderColor: '#413547', flexShrink: 1 },
  speechText: { fontFamily: 'BalooTamma2_700Bold', color: '#413547', fontSize: 18, lineHeight: 24 },
  trail: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  stop: { alignItems: 'center', gap: 5 },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#413547', backgroundColor: '#DAF1FF', alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: '#FFB4D2' },
  dotText: { fontFamily: 'InstrumentSans_600SemiBold', color: '#413547', fontSize: 14 },
  stopText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#283951' },
  stopCurrent: { fontFamily: 'InstrumentSans_600SemiBold' },
  card: { backgroundColor: '#FFF9EF', padding: 22, borderRadius: 28, borderWidth: 2, borderColor: '#413547', shadowColor: '#27394E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 0, elevation: 4, gap: 8 },
  eyebrow: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10, letterSpacing: 1.4, color: '#9D3865' },
  title: { fontFamily: 'BalooTamma2_800ExtraBold', fontSize: 28, lineHeight: 34, color: '#413547' },
  description: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, lineHeight: 21, color: '#746470' },
  options: { gap: 12, marginVertical: 14 },
  option: { padding: 14, minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#DDD0C9', borderRadius: 18, backgroundColor: '#FFFFFF' },
  selected: { backgroundColor: '#FFE0ED', borderColor: '#A44670' },
  levelBadge: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#EDF2F5', alignItems: 'center', justifyContent: 'center' },
  selectedBadge: { backgroundColor: '#FFB4D2' },
  levelNumber: { fontFamily: 'InstrumentSans_600SemiBold', color: '#60233F', fontSize: 13 },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#413547' },
  optionDescription: { fontFamily: 'InstrumentSans_400Regular', fontSize: 12, lineHeight: 18, color: '#746470' },
  note: { fontFamily: 'InstrumentSans_400Regular', fontSize: 11, lineHeight: 17, color: '#746470', textAlign: 'center', paddingHorizontal: 4 },
  label: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#413547' },
  input: { minHeight: 54, borderWidth: 1.5, borderColor: '#A44670', borderRadius: 16, padding: 14, backgroundColor: '#FFF', fontFamily: 'InstrumentSans_400Regular', fontSize: 17, color: '#413547' },
  journey: { padding: 16, backgroundColor: '#E7F4FB', borderRadius: 18, gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10, color: '#37576E', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: '#FFF' },
  primary: { minHeight: 54, borderWidth: 1.5, borderColor: '#A44670', borderRadius: 18, backgroundColor: '#FFB4D2', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  primaryText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#60233F' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8, transform: [{ translateY: 2 }] },
  error: { fontFamily: 'InstrumentSans_400Regular', fontSize: 13, lineHeight: 20, color: '#A12742', paddingVertical: 8 },
  gate: { gap: 18, paddingVertical: 18 },
});
