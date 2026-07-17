import { AppState } from 'react-native';
import type { AppCard, AppSong, LocalPlaylist } from '@/api/types';
import type { AudioQuality } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { registerSync } from './syncBridge';
import { supabase } from './supabase';

/**
 * Cloud sync engine. The local zustand stores remain the UI source of truth and offline cache;
 * these helpers mirror durable library data to Supabase. Every write-through helper is a NO-OP when
 * signed out, so the app works exactly the same with no account.
 *
 * The stores invoke these via the dependency-free `syncBridge` (registered below) rather than
 * importing this module directly — that keeps the store <-> sync dependency one-directional and
 * avoids a require cycle.
 */

const uid = (): string | null => useAuthStore.getState().user?.id ?? null;

/** Fire-and-forget a Supabase write, logging (not surfacing) any error. */
function run(ctx: string, query: PromiseLike<{ error: unknown }>): void {
  Promise.resolve(query)
    .then(({ error }) => {
      if (error) console.warn(`[sync] ${ctx} failed:`, (error as { message?: string })?.message ?? error);
    })
    .catch((e) => console.warn(`[sync] ${ctx} threw:`, e));
}

// ---------------------------------------------------------------------------
// Write-through helpers — invoked from store actions (via syncBridge) after the local set().
// ---------------------------------------------------------------------------

function likeAdded(song: AppSong): void {
  const user_id = uid();
  if (!user_id) return;
  run('like add', supabase.from('liked_songs').upsert({ user_id, song_id: song.id, song }));
}

function likeRemoved(songId: string): void {
  const user_id = uid();
  if (!user_id) return;
  run('like remove', supabase.from('liked_songs').delete().match({ user_id, song_id: songId }));
}

function savedAdded(item: AppCard): void {
  const user_id = uid();
  if (!user_id) return;
  run('saved add', supabase.from('saved_items').upsert({ user_id, item_id: item.id, item }));
}

function savedRemoved(itemId: string): void {
  const user_id = uid();
  if (!user_id) return;
  run('saved remove', supabase.from('saved_items').delete().match({ user_id, item_id: itemId }));
}

function playlistCreated(p: LocalPlaylist): void {
  const user_id = uid();
  if (!user_id) return;
  run(
    'playlist create',
    supabase.from('playlists').upsert({ id: p.id, user_id, name: p.name, created_at_ms: p.createdAt }),
  );
  if (p.songs.length) {
    const rows = p.songs.map((song, i) => ({ playlist_id: p.id, user_id, song_id: song.id, song, position: i }));
    run('playlist create songs', supabase.from('playlist_songs').upsert(rows));
  }
}

function playlistRenamed(id: string, name: string): void {
  const user_id = uid();
  if (!user_id) return;
  run('playlist rename', supabase.from('playlists').update({ name }).match({ id, user_id }));
}

function playlistDeleted(id: string): void {
  const user_id = uid();
  if (!user_id) return;
  // playlist_songs cascade-delete via FK.
  run('playlist delete', supabase.from('playlists').delete().match({ id, user_id }));
}

function playlistSongAdded(playlistId: string, song: AppSong): void {
  const user_id = uid();
  if (!user_id) return;
  const p = useLibraryStore.getState().playlists.find((x) => x.id === playlistId);
  const idx = p ? p.songs.findIndex((s) => s.id === song.id) : -1;
  run(
    'playlist song add',
    supabase
      .from('playlist_songs')
      .upsert({ playlist_id: playlistId, user_id, song_id: song.id, song, position: idx < 0 ? 0 : idx }),
  );
}

function playlistSongRemoved(playlistId: string, songId: string): void {
  const user_id = uid();
  if (!user_id) return;
  run(
    'playlist song remove',
    supabase.from('playlist_songs').delete().match({ playlist_id: playlistId, song_id: songId, user_id }),
  );
}

function preferences(): void {
  const user_id = uid();
  if (!user_id) return;
  const { audioQuality, autoplay } = useSettingsStore.getState();
  run(
    'preferences',
    supabase
      .from('preferences')
      .upsert({ user_id, audio_quality: audioQuality, autoplay, updated_at: new Date().toISOString() }),
  );
}

// Wire the real implementations into the bridge so the stores can call them without importing us.
registerSync({
  likeAdded,
  likeRemoved,
  savedAdded,
  savedRemoved,
  playlistCreated,
  playlistRenamed,
  playlistDeleted,
  playlistSongAdded,
  playlistSongRemoved,
  preferences,
});

// ---------------------------------------------------------------------------
// Reconcile — pull remote, union-merge with local, apply, then push local-only.
// ---------------------------------------------------------------------------

function unionById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const seen = new Set(remote.map((x) => x.id));
  return [...remote, ...local.filter((x) => !seen.has(x.id))];
}

function mergePlaylists(remote: LocalPlaylist[], local: LocalPlaylist[]): LocalPlaylist[] {
  const byId = new Map<string, LocalPlaylist>();
  for (const p of remote) byId.set(p.id, p);
  for (const lp of local) {
    const rp = byId.get(lp.id);
    if (!rp) {
      byId.set(lp.id, lp);
      continue;
    }
    // Union songs by id (remote order first, then local-only). Prefer the remote name.
    const seen = new Set(rp.songs.map((s) => s.id));
    byId.set(lp.id, { ...rp, songs: [...rp.songs, ...lp.songs.filter((s) => !seen.has(s.id))] });
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
}

async function pushAll(
  user_id: string,
  favorites: AppSong[],
  savedItems: AppCard[],
  playlists: LocalPlaylist[],
  audioQuality: AudioQuality,
  autoplay: boolean,
): Promise<void> {
  const tasks: PromiseLike<{ error: unknown }>[] = [];
  if (favorites.length)
    tasks.push(supabase.from('liked_songs').upsert(favorites.map((s) => ({ user_id, song_id: s.id, song: s }))));
  if (savedItems.length)
    tasks.push(supabase.from('saved_items').upsert(savedItems.map((c) => ({ user_id, item_id: c.id, item: c }))));
  if (playlists.length) {
    tasks.push(
      supabase
        .from('playlists')
        .upsert(playlists.map((p) => ({ id: p.id, user_id, name: p.name, created_at_ms: p.createdAt }))),
    );
    const songRows = playlists.flatMap((p) =>
      p.songs.map((s, i) => ({ playlist_id: p.id, user_id, song_id: s.id, song: s, position: i })),
    );
    if (songRows.length) tasks.push(supabase.from('playlist_songs').upsert(songRows));
  }
  tasks.push(
    supabase
      .from('preferences')
      .upsert({ user_id, audio_quality: audioQuality, autoplay, updated_at: new Date().toISOString() }),
  );

  const errors = (await Promise.all(tasks.map((t) => Promise.resolve(t).then((r) => r.error).catch((e) => e)))).filter(
    Boolean,
  );
  if (errors.length) console.warn('[sync] pushAll errors:', errors.map((e) => (e as { message?: string })?.message ?? e));
}

let lastReconcile = 0;

/**
 * Full two-way reconcile, triggered on sign-in and on app foreground. Pulls remote rows,
 * union-merges with the local cache (nothing is lost), applies the merged set locally, then pushes
 * the merged set back up (idempotent upserts — self-heals any writes dropped while offline).
 * Preferences: remote-if-exists wins.
 */
async function reconcileOnSignIn(): Promise<void> {
  const user_id = uid();
  if (!user_id) return;
  lastReconcile = Date.now();
  useAuthStore.setState({ syncing: true });
  try {
    const lib = useLibraryStore.getState();
    const settings = useSettingsStore.getState();

    const [liked, saved, pls, plSongs, prefs] = await Promise.all([
      supabase.from('liked_songs').select('song, created_at').order('created_at', { ascending: false }),
      supabase.from('saved_items').select('item, created_at').order('created_at', { ascending: false }),
      supabase.from('playlists').select('id, name, created_at_ms'),
      supabase.from('playlist_songs').select('playlist_id, song, position'),
      supabase.from('preferences').select('audio_quality, autoplay').eq('user_id', user_id).maybeSingle(),
    ]);

    const remoteFavs = (liked.data ?? []).map((r) => r.song as AppSong).filter(Boolean);
    const mergedFavs = unionById(remoteFavs, lib.favorites);

    const remoteSaved = (saved.data ?? []).map((r) => r.item as AppCard).filter(Boolean);
    const mergedSaved = unionById(remoteSaved, lib.savedItems);

    const songsByPlaylist = new Map<string, { song: AppSong; position: number }[]>();
    for (const row of plSongs.data ?? []) {
      const arr = songsByPlaylist.get(row.playlist_id) ?? [];
      arr.push({ song: row.song as AppSong, position: (row.position as number) ?? 0 });
      songsByPlaylist.set(row.playlist_id, arr);
    }
    const remotePlaylists: LocalPlaylist[] = (pls.data ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      createdAt: Number(p.created_at_ms) || Date.now(),
      songs: (songsByPlaylist.get(p.id as string) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((r) => r.song)
        .filter(Boolean),
    }));
    const mergedPlaylists = mergePlaylists(remotePlaylists, lib.playlists);

    // Preferences: a returning user's cloud preference is the cross-device intent.
    let mergedQuality = settings.audioQuality;
    let mergedAutoplay = settings.autoplay;
    if (prefs.data) {
      if (prefs.data.audio_quality) mergedQuality = prefs.data.audio_quality as AudioQuality;
      if (typeof prefs.data.autoplay === 'boolean') mergedAutoplay = prefs.data.autoplay;
    }

    // Apply merged → local via the no-echo setters (these never call sync helpers).
    useLibraryStore.getState().replaceFromRemote({
      favorites: mergedFavs,
      savedItems: mergedSaved,
      playlists: mergedPlaylists,
    });
    useSettingsStore.getState().replaceFromRemote({ audioQuality: mergedQuality, autoplay: mergedAutoplay });

    // Push the merged set up so local-only rows land in the cloud.
    await pushAll(user_id, mergedFavs, mergedSaved, mergedPlaylists, mergedQuality, mergedAutoplay);

    // Keep the profile row fresh from the Google identity.
    const profile = useAuthStore.getState().profile;
    if (profile) {
      run(
        'profile upsert',
        supabase.from('profiles').upsert({
          id: user_id,
          email: profile.email,
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
          updated_at: new Date().toISOString(),
        }),
      );
    }
  } catch (e) {
    console.warn('[sync] reconcile failed:', e);
  } finally {
    useAuthStore.setState({ syncing: false });
  }
}

let appStateRegistered = false;
let authSubRegistered = false;

/**
 * Start cloud sync: reconcile whenever auth transitions to signed-in, and again on app foreground
 * (throttled to 30s) so other-device changes are pulled in. Idempotent — safe to call once at boot.
 * Kept here (not in authStore) so the auth store has no dependency on the sync engine.
 */
export function initSync(): void {
  if (!appStateRegistered) {
    appStateRegistered = true;
    AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (useAuthStore.getState().status !== 'signedIn') return;
      if (Date.now() - lastReconcile < 30_000) return;
      void reconcileOnSignIn();
    });
  }

  // Catch a session that was already restored before this ran.
  if (useAuthStore.getState().status === 'signedIn') void reconcileOnSignIn();

  if (!authSubRegistered) {
    authSubRegistered = true;
    useAuthStore.subscribe((s, prev) => {
      if (s.status === 'signedIn' && prev.status !== 'signedIn') void reconcileOnSignIn();
    });
  }
}
