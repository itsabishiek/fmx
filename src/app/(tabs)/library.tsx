import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Artwork } from '@/components/Artwork';
import { MediaCard } from '@/components/MediaCard';
import { SectionHeader } from '@/components/HorizontalShelf';
import { EmptyState } from '@/components/states';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useUIStore } from '@/store/uiStore';
import { layout, palette, spacing } from '@/theme';

function MenuRow({
  icon,
  label,
  count,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={palette.accent} style={{ width: 32 }} />
      <AppText variant="title3" style={{ flex: 1 }}>
        {label}
      </AppText>
      {count !== undefined ? (
        <AppText variant="body" color="secondary">
          {count}
        </AppText>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
    </Pressable>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, playlists, savedItems } = useLibraryStore();
  const openCreate = useUIStore((s) => s.openCreatePlaylist);
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  const avatarUrl = useAuthStore((s) => s.profile?.avatarUrl);

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: layout.scrollBottomPad }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <AppText variant="largeTitle">Library</AppText>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/account')} hitSlop={8}>
            {signedIn && avatarUrl ? (
              <Artwork uri={avatarUrl} size={30} round />
            ) : (
              <Ionicons name="person-circle-outline" size={30} color={palette.textPrimary} />
            )}
          </Pressable>
          <Pressable onPress={openCreate} hitSlop={8}>
            <Ionicons name="add" size={30} color={palette.accent} />
          </Pressable>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuRow icon="heart" label="Liked Songs" count={favorites.length} onPress={() => router.push('/favorites')} />
      </View>

      <View style={styles.playlistHeader}>
        <SectionHeader title="Playlists" />
        <Pressable onPress={openCreate} hitSlop={8} style={{ paddingRight: spacing.base }}>
          <AppText variant="callout" color="accent">
            New
          </AppText>
        </Pressable>
      </View>

      {playlists.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.base }}>
          <AppText variant="subhead" color="secondary">
            No playlists yet. Tap “New” to create one.
          </AppText>
        </View>
      ) : (
        playlists.map((p) => (
          <Pressable
            key={p.id}
            style={({ pressed }) => [styles.playlistRow, pressed && { opacity: 0.6 }]}
            onPress={() => router.push(`/local-playlist/${p.id}`)}>
            <Artwork uri={p.songs[0]?.artworkSmall} size={56} rounded="sm" />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText variant="headline" numberOfLines={1}>
                {p.name}
              </AppText>
              <AppText variant="subhead" color="secondary">
                {p.songs.length} {p.songs.length === 1 ? 'song' : 'songs'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
          </Pressable>
        ))
      )}

      {savedItems.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Saved" />
          <View style={styles.savedGrid}>
            {savedItems.map((item) => (
              <MediaCard key={`${item.type}-${item.id}`} item={item} size={150} />
            ))}
          </View>
        </View>
      ) : null}

      {favorites.length === 0 && playlists.length === 0 && savedItems.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Your library is empty"
          subtitle="Like songs and create playlists — they’ll be saved on this device."
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  menu: { paddingHorizontal: spacing.base, marginBottom: spacing.lg },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  playlistHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  savedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    paddingHorizontal: spacing.base,
  },
});
