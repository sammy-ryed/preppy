import { WebView } from 'react-native-webview';
export function GameView({uri,onMessage,onError}:{uri:string;onMessage:(raw:string)=>void;onError:()=>void}) {
  const origin=new URL(uri).origin;
  return <WebView source={{uri}} style={{flex:1}} javaScriptEnabled onMessage={event=>onMessage(event.nativeEvent.data)}
    onError={onError} onHttpError={onError} setSupportMultipleWindows={false}
    onShouldStartLoadWithRequest={request=>{try{return new URL(request.url).origin===origin;}catch{return false;}}} />;
}
