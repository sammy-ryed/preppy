import { SoundPressable as Pressable } from '../../components/learning/SoundPressable';
import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useGameSession } from '../../hooks/useGameSession';
import { GameLobby } from '../../components/learning/GameLobby';
import { GameView } from '../../components/learning/GameView';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GameScreen() {
  const {checkpointId}=useLocalSearchParams<{checkpointId:string}>();
  return <GameSession key={checkpointId} checkpointId={checkpointId} />;
}
function GameSession({checkpointId}:{checkpointId:string}) {
  const game=useGameSession(checkpointId);const router=useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [stableViewport, setStableViewport] = useState('');
  const viewport = width > height ? width + ':' + height : '';
  useEffect(() => {
    if (!viewport || game.status !== 'active') return;
    const timer = setTimeout(() => setStableViewport(viewport), 400);
    return () => clearTimeout(timer);
  }, [viewport, game.status]);
  useEffect(() => {
    if (game.status === 'cancelled') router.replace('/map');
  }, [game.status, router]);
  useEffect(()=>{
    const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{
      if(game.status==='saving') return true;
      if(game.status==='active') {void game.cancel();return true;}
      return false;
    });return ()=>subscription.remove();
  },[game]);
  const playing = game.status === 'active' || game.status === 'saving';
  if (playing) return <View style={{ flex: 1, backgroundColor: '#000' }}>
    <Stack.Screen options={{ gestureEnabled: false, orientation: 'landscape', statusBarHidden: true, navigationBarHidden: true }} />
    <StatusBar hidden />
    {game.status === 'active' && game.uri && viewport && stableViewport === viewport && <GameView key={game.reloadKey} uri={game.uri} onMessage={game.receive} onError={game.loadError} />}
    {game.status === 'active' && (!viewport || stableViewport !== viewport) && <View style={s.overlay}><ActivityIndicator color="white" /><Text style={{ color: 'white' }}>Preparing landscape game…</Text></View>}
    {game.status === 'saving' && !game.error && <View style={s.overlay}><ActivityIndicator color="white" /><Text style={{ color: 'white' }}>Saving…</Text></View>}
    {game.status === 'active' && <Pressable accessibilityRole="button" style={[s.exit, { top: Math.max(8, insets.top), right: Math.max(8, insets.right) }]} onPress={() => void game.cancel()}><Text style={{ color: 'white' }}>Return to map</Text></Pressable>}
    {game.error && <View style={s.overlay}><Text style={{ color: 'white', textAlign: 'center' }}>{game.error}</Text><Pressable style={s.button} onPress={() => void game.retry()}><Text style={s.buttonText}>Retry</Text></Pressable></View>}
  </View>;
  return <>
    <Stack.Screen options={{ gestureEnabled: false, orientation: 'portrait', statusBarHidden: false, navigationBarHidden: false }} />
    <StatusBar hidden={false} style="dark" />
    <GameLobby game={game} onBack={() => router.replace('/map')} />
  </>;

}
const s=StyleSheet.create({root:{flex:1,padding:20,gap:14,backgroundColor:'#F0F4FF'},title:{fontFamily:'BalooTamma2_700Bold',fontSize:26,color:'#2563B8'},button:{backgroundColor:'#3A7BD5',padding:14,borderRadius:14},buttonText:{color:'white',textAlign:'center'},error:{color:'#b00020'},exit:{position:'absolute',padding:12,borderRadius:18,backgroundColor:'rgba(0,0,0,0.65)',zIndex:2},overlay:{position:'absolute',top:0,left:0,right:0,bottom:0,alignItems:'center',justifyContent:'center',gap:16,padding:32,backgroundColor:'rgba(0,0,0,0.8)'}});
