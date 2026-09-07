import { Text, View } from 'react-native';
export function GameView(_props:{uri:string;onMessage:(raw:string)=>void;onError:()=>void}) {
  return <View><Text>Open this game in PREPPY on your phone. The native game bridge is not available in the web preview.</Text></View>;
}
