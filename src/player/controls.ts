import TrackPlayer, { RepeatMode, State } from 'react-native-track-player';
import type { AppSong } from '@/api/types';
import { getSongSuggestions } from '@/api/endpoints';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { usePlaybackStore } from './playbackStore';
import { setupPlayer } from './setup';
import { playableSongs, songToTrack } from './track';

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Replace the queue with `songs` and start playing at `startIndex`.
 * Filters out songs with no stream URL at the current quality.
 */
export async function playSongList(
  songs: AppSong[],
  startIndex = 0,
  opts: { shuffle?: boolean } = {},
): Promise<void> {
  await setupPlayer();
  let list = playableSongs(songs);
  if (!list.length) return;

  let start = Math.max(0, Math.min(startIndex, list.length - 1));

  if (opts.shuffle) {
    const first = list[start];
    const rest = list.filter((_, i) => i !== start);
    shuffleInPlace(rest);
    list = [first, ...rest];
    start = 0;
    usePlaybackStore.getState().setShuffle(true);
  }

  await TrackPlayer.reset();
  await TrackPlayer.add(list.map(songToTrack));
  if (start > 0) await TrackPlayer.skip(start);
  usePlaybackStore.getState().setQueueSongs(list);
  usePlaybackStore.getState().setCurrentSong(list[start]);
  await TrackPlayer.play();
}

/** Play a single song now (clears the queue). */
export async function playSong(song: AppSong): Promise<void> {
  await playSongList([song], 0);
}

/** Insert a song right after the currently playing track (or play now if nothing is playing). */
export async function playNext(song: AppSong): Promise<void> {
  await setupPlayer();
  if (!playableSongs([song]).length) {
    useUIStore.getState().showToast('Song unavailable');
    return;
  }
  const idx = (await TrackPlayer.getActiveTrackIndex()) ?? -1;
  const wasIdle = idx < 0 || usePlaybackStore.getState().queueSongs.length === 0;
  const insertAt = idx >= 0 ? idx + 1 : undefined;
  await TrackPlayer.add([songToTrack(song)], insertAt);
  const queue = usePlaybackStore.getState().queueSongs;
  const next = [...queue];
  next.splice(insertAt ?? next.length, 0, song);
  usePlaybackStore.getState().setQueueSongs(next);
  if (wasIdle) {
    usePlaybackStore.getState().setCurrentSong(song);
    await TrackPlayer.play();
    useUIStore.getState().showToast('Playing now');
  } else {
    useUIStore.getState().showToast('Playing next');
  }
}

/** Append a song to the end of the queue (or start playing it if nothing is playing). */
export async function addToQueue(song: AppSong): Promise<void> {
  await setupPlayer();
  if (!playableSongs([song]).length) {
    useUIStore.getState().showToast('Song unavailable');
    return;
  }
  const activeIndex = await TrackPlayer.getActiveTrackIndex();
  const wasIdle = activeIndex == null || usePlaybackStore.getState().queueSongs.length === 0;
  await TrackPlayer.add([songToTrack(song)]);
  const queue = usePlaybackStore.getState().queueSongs;
  usePlaybackStore.getState().setQueueSongs([...queue, song]);
  if (wasIdle) {
    usePlaybackStore.getState().setCurrentSong(song);
    await TrackPlayer.play();
    useUIStore.getState().showToast('Playing now');
  } else {
    useUIStore.getState().showToast('Added to queue');
  }
}

export async function togglePlayback(): Promise<void> {
  const state = (await TrackPlayer.getPlaybackState()).state;
  if (state === State.Playing) await TrackPlayer.pause();
  else await TrackPlayer.play();
}

export const skipToNext = () => TrackPlayer.skipToNext().catch(() => {});
export const skipToPrevious = async () => {
  // Restart current track if we're past the first few seconds, like Apple Music.
  const { position } = await TrackPlayer.getProgress();
  if (position > 3) {
    await TrackPlayer.seekTo(0);
    return;
  }
  await TrackPlayer.skipToPrevious().catch(() => TrackPlayer.seekTo(0));
};
export const seekTo = (sec: number) => TrackPlayer.seekTo(sec);

/** Cycle Off → Queue → Track repeat modes; returns the new mode. */
export async function cycleRepeatMode(): Promise<RepeatMode> {
  const mode = await TrackPlayer.getRepeatMode();
  const next =
    mode === RepeatMode.Off
      ? RepeatMode.Queue
      : mode === RepeatMode.Queue
        ? RepeatMode.Track
        : RepeatMode.Off;
  await TrackPlayer.setRepeatMode(next);
  return next;
}

/**
 * Toggle shuffle. Turning on reshuffles all upcoming tracks while the current
 * track keeps playing uninterrupted.
 */
export async function toggleShuffle(): Promise<boolean> {
  const store = usePlaybackStore.getState();
  const on = !store.shuffle;
  store.setShuffle(on);
  if (!on) return on;

  const songs = store.queueSongs;
  if (songs.length <= 2) return on;
  const idx = (await TrackPlayer.getActiveTrackIndex()) ?? 0;
  const current = songs[idx];
  const rest = songs.filter((_, i) => i !== idx);
  shuffleInPlace(rest);
  await TrackPlayer.removeUpcomingTracks();
  await TrackPlayer.add(rest.map(songToTrack));
  store.setQueueSongs([current, ...rest]);
  return on;
}

export async function clearQueue(): Promise<void> {
  await TrackPlayer.reset();
  usePlaybackStore.getState().setQueueSongs([]);
  usePlaybackStore.getState().setCurrentSong(null);
}

/** Reorder the queue: move the song at `from` to position `to` (track-player + mirror store). */
export async function moveInQueue(from: number, to: number): Promise<void> {
  const queue = usePlaybackStore.getState().queueSongs;
  if (from < 0 || to < 0 || from >= queue.length || to >= queue.length || from === to) return;
  await TrackPlayer.move(from, to);
  const next = [...queue];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  usePlaybackStore.getState().setQueueSongs(next);
}

/** Remove an upcoming song from the queue by its position in queueSongs. */
export async function removeFromQueue(index: number): Promise<void> {
  const active = (await TrackPlayer.getActiveTrackIndex()) ?? 0;
  if (index <= active) return; // can't remove current/played
  await TrackPlayer.remove([index]);
  const queue = usePlaybackStore.getState().queueSongs;
  usePlaybackStore.getState().setQueueSongs(queue.filter((_, i) => i !== index));
}

/**
 * Apple-Music-style Autoplay: when the queue ends, fetch suggestions seeded from
 * the last played track and append them so music keeps flowing.
 */
export async function appendSuggestions(seedSongId: string): Promise<void> {
  if (!useSettingsStore.getState().autoplay) return;
  const suggestions = playableSongs(await getSongSuggestions(seedSongId, 15));
  const existing = new Set(usePlaybackStore.getState().queueSongs.map((s) => s.id));
  const fresh = suggestions.filter((s) => !existing.has(s.id));
  if (!fresh.length) return;
  await TrackPlayer.add(fresh.map(songToTrack));
  const queue = usePlaybackStore.getState().queueSongs;
  usePlaybackStore.getState().setQueueSongs([...queue, ...fresh]);
  // The queue had ended (player stopped on the last track) — advance into the
  // freshly-appended suggestions and keep playing.
  await TrackPlayer.skipToNext().catch(() => {});
  await TrackPlayer.play();
}
