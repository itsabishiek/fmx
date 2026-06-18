import { Image } from 'expo-image';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius } from '@/theme';

const BLURHASH = 'L00000fQfQfQfQfQfQfQfQfQfQfQ';

interface ArtworkProps {
  uri?: string;
  size: number;
  round?: boolean;
  rounded?: keyof typeof radius;
  style?: ViewStyle;
}

/** Square (or circular) cached artwork with a graceful placeholder. */
export function Artwork({ uri, size, round, rounded = 'md', style }: ArtworkProps) {
  const borderRadius = round ? size / 2 : radius[rounded];
  return (
    <View style={[{ width: size, height: size, borderRadius }, styles.wrap, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius }}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: BLURHASH }}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
          <Ionicons name="musical-notes" size={size * 0.4} color={palette.textTertiary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.surfaceAlt,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
});
