import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { AppCard } from '@/api/types';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

interface MediaCardProps {
  item: AppCard;
  size?: number;
  /** Override the default navigation. */
  onPress?: () => void;
}

export function navigateToCard(item: AppCard) {
  switch (item.type) {
    case 'album':
      router.push(`/album/${item.id}`);
      break;
    case 'artist':
      router.push(`/artist/${item.id}`);
      break;
    case 'playlist':
      router.push(`/playlist/${item.id}`);
      break;
  }
}

export function MediaCard({ item, size = 150, onPress }: MediaCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [{ width: size, opacity: pressed ? 0.7 : 1 }]}
      onPress={() => (onPress ? onPress() : navigateToCard(item))}>
      <Artwork uri={item.image} size={size} round={item.round} rounded="md" />
      <View style={{ marginTop: spacing.sm }}>
        <AppText
          variant="callout"
          numberOfLines={1}
          style={item.round ? { textAlign: 'center' } : undefined}>
          {item.title}
        </AppText>
        {item.subtitle ? (
          <AppText
            variant="caption"
            color="secondary"
            numberOfLines={1}
            style={[{ marginTop: 2 }, item.round ? { textAlign: 'center' } : undefined]}>
            {item.subtitle}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
