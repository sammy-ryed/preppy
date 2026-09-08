import { Image, View } from 'react-native';
import type { BadgeId } from '../../domain/badges';

const artwork = {
  'first-solved': require('../../assets/firstlesson.png'),
  'zero-mistakes': require('../../assets/zeromistakes.png'),
  'region-1': require('../../assets/region1.png'),
  'region-2': require('../../assets/region2.png'),
  'region-3': require('../../assets/region3.png'),
};

export function BadgeArt({ id, width, locked = false }: { id: BadgeId; width: number; locked?: boolean }) {
  const source = artwork[id];
  // Keep the full supplied card, including its border and footer, at its original ratio.
  const height = width * (id === 'region-2' || id === 'region-3' ? 1536 / 1024 : 830 / 553);
  return <View accessible={false} style={{ width, height, opacity: locked ? 0.25 : 1 }}>
    <Image source={source} style={{ width, height }} resizeMode="contain" />
  </View>;
}
