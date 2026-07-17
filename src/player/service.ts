import TrackPlayer, { Event } from 'react-native-track-player';
import type { AppSong } from '@/api/types';
import { useHistoryStore } from '@/store/historyStore';
import { appendSuggestions, skipToNext, skipToPrevious } from './controls';
import { usePlaybackStore } from './playbackStore';

/**
 * The track-player playback service. Runs in a background/headless context and wires
 * the OS remote controls (lock screen, notification, headset, Bluetooth) to playback,
 * tracks listening history, and powers Autoplay when the queue ends.
 *
 * Registered via TrackPlayer.registerPlaybackService in the app entry (index.js).
 */
export const PlaybackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(position + (interval ?? 15));
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, position - (interval ?? 15)));
  });

  // Keep the runtime "current song" in sync and record listening history. The displayed metadata
  // must ALWAYS follow the actually-playing track. Resolve by the event's `index` into the queue
  // mirror first: after a reorder the event's `track` payload is stale (a KotlinAudio quirk) but
  // its `index` is correct, and the mirror is kept aligned with RNTP's real order. Fall back to
  // the id lookup / reconstruct-from-track only when the index is unusable.
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async ({ index, track }) => {
    const queue = usePlaybackStore.getState().queueSongs;
    let song: AppSong | undefined =
      typeof index === 'number' && index >= 0 && index < queue.length ? queue[index] : undefined;

    if (!song) {
      const t = track as
        | {
            id?: string | number;
            songId?: string;
            title?: string;
            artist?: string;
            album?: string;
            artwork?: string;
            duration?: number;
            albumId?: string;
            artistId?: string;
            language?: string;
            hasLyrics?: boolean;
            url?: string;
          }
        | undefined;
      const id = t?.songId ?? (t?.id != null ? String(t.id) : undefined);
      if (!id) return;
      song = usePlaybackStore.getState().songById(id) ?? {
        id,
        title: t?.title ?? '',
        artistName: t?.artist ?? '',
        artistId: t?.artistId,
        albumName: t?.album,
        albumId: t?.albumId,
        artwork: t?.artwork ?? '',
        artworkSmall: t?.artwork ?? '',
        duration: typeof t?.duration === 'number' ? t.duration : 0,
        language: t?.language,
        hasLyrics: !!t?.hasLyrics,
        downloadUrls: [],
        url: t?.url,
      };
    }

    usePlaybackStore.getState().setCurrentSong(song);
    useHistoryStore.getState().addToHistory(song);
  });

  // Autoplay: when the last track finishes, extend the queue with suggestions.
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    const queue = usePlaybackStore.getState().queueSongs;
    const seed = queue[queue.length - 1]?.id;
    if (seed) await appendSuggestions(seed);
  });
};

export default PlaybackService;
