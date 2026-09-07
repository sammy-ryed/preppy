import { WebView } from 'react-native-webview';
import { useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { gameStartupScript } from './gameStartupScript';
import { gameUserAgent } from '../../domain/gameUserAgent';
export function GameView({uri,onMessage,onError}:{uri:string;onMessage:(raw:string)=>void;onError:(message?:string)=>void}) {
  const [userAgent, setUserAgent] = useState<string>();
  const origin=new URL(uri).origin;
  // Read this device's real UA before requesting the game. A native userAgent
  // override applies before any engine JS, avoiding Android's injection race.
  if (Platform.OS === 'android' && !userAgent) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
    <ActivityIndicator color="white" />
    <WebView source={{ html: '<!doctype html><html><body></body></html>' }}
      style={{ width: 1, height: 1, opacity: 0 }} containerStyle={{ position: 'absolute', width: 1, height: 1 }}
      injectedJavaScript="window.ReactNativeWebView.postMessage(navigator.userAgent); true;"
      onMessage={event => { const value = event.nativeEvent.data; if (value && value.length < 2048) setUserAgent(gameUserAgent(value)); }}
      onError={() => onError('Could not initialize the Android game browser. Please retry.')} />
  </View>;
  return <WebView source={{uri}} style={{flex:1,backgroundColor:'#000'}} javaScriptEnabled domStorageEnabled androidLayerType="hardware"
    userAgent={userAgent}
    injectedJavaScriptBeforeContentLoaded={gameStartupScript} injectedJavaScript={gameStartupScript}
    mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback
    onMessage={event=>{
      const raw=event.nativeEvent.data;
      try { const value=JSON.parse(raw); if(value?.type==='PREPPY_STARTUP_ERROR' && typeof value.message==='string') {onError(value.message.slice(0,700));return;} } catch { /* Gameplay parser handles malformed messages. */ }
      onMessage(raw);
    }}
    allowsFullscreenVideo scrollEnabled={false} bounces={false} contentInsetAdjustmentBehavior="never"
    onError={event=>onError(event.nativeEvent.description)} onHttpError={event=>onError('Game request failed: HTTP '+event.nativeEvent.statusCode)} setSupportMultipleWindows={false}
    onRenderProcessGone={()=>onError('Android stopped the game renderer. Close other apps and retry.')}
    onContentProcessDidTerminate={()=>onError('The game renderer stopped. Please retry.')}
    onShouldStartLoadWithRequest={request=>{try{return new URL(request.url).origin===origin;}catch{return false;}}} />;
}
