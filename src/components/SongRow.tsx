import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppSong } from '@/api/types';
import { palette, spacing } from '@/theme';
import { useCurrentSong, useIsPlaying } from '@/player/usePlayer';
import { useUIStore } from '@/store/uiStore';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

interface SongRowProps {
  song: AppSong;
  /** Called when the row body is tapped (usually plays the song / list). */
  onPress: () => void;
  /** Show a leading index number instead of artwork (album track lists). */
  index?: number;
  /** Local playlist context, passed to the action sheet for "remove from playlist". */
  playlistId?: string;
  showArtwork?: boolean;
}

function SongRowBase({ song, onPress, index, playlistId, showArtwork = true }: SongRowProps) {
  const current = useCurrentSong();
  const { playing } = useIsPlaying();
  const isCurrent = current?.id === song.id;
  const openActions = useUIStore((s) => s.openSongActions);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={() => openActions(song, playlistId)}>
      {showArtwork ? (
        <Artwork uri={song.artworkSmall} size={48} rounded="sm" />
      ) : (
        <View style={styles.indexBox}>
          {isCurrent ? (
            <Ionicons
              name={playing ? 'volume-high' : 'pause'}
              size={16}
              color={palette.accent}
            />
          ) : (
            <AppText variant="callout" color="secondary">
              {(index ?? 0) + 1}
            </AppText>
          )}
        </View>
      )}

      <View style={styles.meta}>
        <AppText
          variant="body"
          numberOfLines={1}
          color={isCurrent ? 'accent' : 'primary'}>
          {song.title}
        </AppText>
        <AppText variant="subhead" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
          {song.artistName}
        </AppText>
      </View>

      <Pressable
        hitSlop={10}
        onPress={() => openActions(song, playlistId)}
        style={styles.more}>
        <Ionicons name="ellipsis-horizontal" size={20} color={palette.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

export const SongRow = memo(SongRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  pressed: { backgroundColor: palette.surface },
  indexBox: { width: 48, alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, marginLeft: spacing.md },
  more: { padding: spacing.sm },
});
