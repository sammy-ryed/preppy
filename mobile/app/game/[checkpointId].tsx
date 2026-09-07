import { useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameSession } from '../../hooks/useGameSession';
import { GameView } from '../../components/learning/GameView';

export default function GameScreen() {
  const {checkpointId}=useLocalSearchParams<{checkpointId:string}>();
  return <GameSession key={checkpointId} checkpointId={checkpointId} />;
}
function GameSession({checkpointId}:{checkpointId:string}) {
  const game=useGameSession(checkpointId);const router=useRouter();
  useEffect(()=>{
    const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{
      if(game.status==='saving') return true;
      if(game.status==='active') {void game.cancel();return true;}
      return false;
    });return ()=>subscription.remove();
  },[game]);
  const terminal=['completed','skipped','cancelled'].includes(game.status);
  const alreadyResolved=game.checkpoint?.status==='completed'||game.checkpoint?.status==='skipped';
  const unavailable=!game.checkpoint||game.checkpoint.status==='locked';
  return <View style={s.root}>
    <Stack.Screen options={{gestureEnabled:false}} />
    <Text style={s.title}>Game break</Text>
    {game.loading?<ActivityIndicator/>:unavailable?<Text>This checkpoint is locked or unavailable.</Text>:<>
      {!game.uri&&<Text>The game is not available online yet. You can skip this break without a game reward.</Text>}
      {Platform.OS==='web'&&<Text>Game launch is available in the phone app.</Text>}
      {(terminal||alreadyResolved)&&<Text>{game.status==='cancelled'?'Game exited. Your checkpoint is still available.':`Checkpoint ${game.checkpoint?.status==='skipped'||game.status==='skipped'?'skipped':'completed'}. ${game.xp?`+${game.xp} XP`:''}`}</Text>}
      {game.status==='idle'&&!alreadyResolved&&game.uri&&Platform.OS!=='web'&&<Pressable style={s.button} onPress={()=>void game.launch()}><Text style={s.buttonText}>Launch game</Text></Pressable>}
      {game.status==='active'&&game.uri&&<GameView key={game.reloadKey} uri={game.uri} onMessage={game.receive} onError={game.loadError}/>}
      {game.status==='saving'&&!game.error&&<ActivityIndicator/>}
      {game.error&&<><Text style={s.error}>{game.error}</Text><Pressable style={s.button} onPress={()=>void game.retry()}><Text style={s.buttonText}>Retry</Text></Pressable></>}
      {!terminal&&!alreadyResolved&&game.status!=='saving'&&game.checkpoint?.canSkip&&<Pressable style={s.button} onPress={()=>void game.skip()}><Text style={s.buttonText}>Skip without reward</Text></Pressable>}
    </>}
    {game.status!=='saving'&&<Pressable style={s.button} onPress={()=>game.status==='active'?void game.cancel():router.replace('/map')}><Text style={s.buttonText}>{game.status==='active'?'Exit game':'Back to map'}</Text></Pressable>}
  </View>;
}
const s=StyleSheet.create({root:{flex:1,padding:20,gap:14,backgroundColor:'#F0F4FF'},title:{fontFamily:'BalooTamma2_700Bold',fontSize:26,color:'#2563B8'},button:{backgroundColor:'#3A7BD5',padding:14,borderRadius:14},buttonText:{color:'white',textAlign:'center'},error:{color:'#b00020'}});
