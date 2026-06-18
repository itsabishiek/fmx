import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { addToQueue, playNext } from '@/player/controls';
import { useLibraryStore } from '@/store/libraryStore';
import { useUIStore } from '@/store/uiStore';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

function Backdrop({ onPress }: { onPress: () => void }) {
  return <Pressable style={styles.backdrop} onPress={onPress} />;
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  accent?: boolean;
}) {
  const color = danger ? '#ff5a5a' : accent ? palette.accent : palette.textPrimary;
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} style={{ width: 30 }} />
      <AppText variant="body" style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function SongActionsSheet() {
  const song = useUIStore((s) => s.songActions);
  const playlistId = useUIStore((s) => s.songActionsPlaylistId);
  const close = useUIStore((s) => s.closeSongActions);
  const openAddToPlaylist = useUIStore((s) => s.openAddToPlaylist);
  const { isFavorite, toggleFavorite, removeFromPlaylist } = useLibraryStore();

  const liked = song ? isFavorite(song.id) : false;

  return (
    <Modal visible={!!song} transparent animationType="slide" onRequestClose={close}>
      <Backdrop onPress={close} />
      <View style={styles.sheet}>
        {song && (
          <>
            <View style={styles.sheetHeader}>
              <Artwork uri={song.artworkSmall} size={52} rounded="sm" />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <AppText variant="headline" numberOfLines={1}>
                  {song.title}
                </AppText>
                <AppText variant="subhead" color="secondary" numberOfLines={1}>
                  {song.artistName}
                </AppText>
              </View>
            </View>
            <View style={styles.divider} />
            <ActionRow
              icon={liked ? 'heart' : 'heart-outline'}
              label={liked ? 'Remove from Favorites' : 'Add to Favorites'}
              accent={liked}
              onPress={() => {
                toggleFavorite(song);
                close();
              }}
            />
            <ActionRow icon="play-skip-forward-outline" label="Play Next" onPress={() => { playNext(song); close(); }} />
            <ActionRow icon="list-outline" label="Add to Queue" onPress={() => { addToQueue(song); close(); }} />
            <ActionRow icon="add-circle-outline" label="Add to Playlist" onPress={() => openAddToPlaylist(song)} />
            {song.albumId ? (
              <ActionRow
                icon="albums-outline"
                label="Go to Album"
                onPress={() => { close(); router.push(`/album/${song.albumId}`); }}
              />
            ) : null}
            {song.artistId ? (
              <ActionRow
                icon="person-outline"
                label="Go to Artist"
                onPress={() => { close(); router.push(`/artist/${song.artistId}`); }}
              />
            ) : null}
            {playlistId ? (
              <ActionRow
                icon="trash-outline"
                label="Remove from Playlist"
                danger
                onPress={() => { removeFromPlaylist(playlistId, song.id); close(); }}
              />
            ) : null}
          </>
        )}
      </View>
    </Modal>
  );
}

function AddToPlaylistSheet() {
  const song = useUIStore((s) => s.addToPlaylistFor);
  const close = useUIStore((s) => s.closeAddToPlaylist);
  const { playlists, addToPlaylist, createPlaylist } = useLibraryStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const reset = () => {
    setCreating(false);
    setName('');
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createPlaylist(name, song ? [song] : []);
    reset();
    close();
  };

  return (
    <Modal
      visible={song !== undefined}
      transparent
      animationType="slide"
      onRequestClose={() => { reset(); close(); }}>
      <Backdrop onPress={() => { reset(); close(); }} />
      <View style={styles.sheet}>
        <AppText variant="title3" style={{ marginBottom: spacing.md }}>
          Add to Playlist
        </AppText>

        {creating ? (
          <View style={styles.createRow}>
            <TextInput
              autoFocus
              placeholder="Playlist name"
              placeholderTextColor={palette.textTertiary}
              value={name}
              onChangeText={setName}
              style={styles.input}
              onSubmitEditing={handleCreate}
            />
            <Pressable style={styles.createBtn} onPress={handleCreate}>
              <AppText variant="callout" style={{ color: palette.textOnAccent }}>
                Create
              </AppText>
            </Pressable>
          </View>
        ) : (
          <ActionRow icon="add" label="New Playlist" accent onPress={() => setCreating(true)} />
        )}

        <ScrollView style={{ maxHeight: 320 }}>
          {playlists.map((p) => (
            <ActionRow
              key={p.id}
              icon="musical-notes-outline"
              label={`${p.name}  ·  ${p.songs.length}`}
              onPress={() => {
                if (song) addToPlaylist(p.id, song);
                close();
              }}
            />
          ))}
          {playlists.length === 0 && !creating ? (
            <AppText variant="subhead" color="secondary" style={{ padding: spacing.md }}>
              No playlists yet. Create one above.
            </AppText>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function CreatePlaylistModal() {
  const open = useUIStore((s) => s.createPlaylistOpen);
  const close = useUIStore((s) => s.closeCreatePlaylist);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    setName('');
    close();
    if (trimmed) {
      const id = createPlaylist(trimmed);
      router.push(`/local-playlist/${id}`);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
      <Backdrop onPress={close} />
      <View style={styles.sheet}>
        <AppText variant="title3" style={{ marginBottom: spacing.md }}>
          New Playlist
        </AppText>
        <View style={styles.createRow}>
          <TextInput
            autoFocus
            placeholder="Playlist name"
            placeholderTextColor={palette.textTertiary}
            value={name}
            onChangeText={setName}
            style={styles.input}
            onSubmitEditing={handleCreate}
          />
          <Pressable style={styles.createBtn} onPress={handleCreate}>
            <AppText variant="callout" style={{ color: palette.textOnAccent }}>
              Create
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Mount once near the app root. */
export function GlobalSheets() {
  return (
    <>
      <SongActionsSheet />
      <AddToPlaylistSheet />
      <CreatePlaylistModal />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.elevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: spacing.md },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.6 },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.textPrimary,
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: palette.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});
