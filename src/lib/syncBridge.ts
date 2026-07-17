import type { AppCard, AppSong, LocalPlaylist } from '@/api/types';

/**
 * Dependency-free bridge between the zustand stores and the cloud sync engine.
 *
 * The stores must fire write-through calls on mutation, but the sync engine also reads/replaces
 * store state — a direct import both ways creates a require cycle. This module imports NOTHING at
 * runtime (types only), so both sides can depend on it without a cycle: `sync.ts` fills in the real
 * implementations via `registerSync()` at boot, and the stores call `sync.*` (no-ops until then).
 */
export interface SyncApi {
  likeAdded(song: AppSong): void;
  likeRemoved(songId: string): void;
  savedAdded(item: AppCard): void;
  savedRemoved(itemId: string): void;
  playlistCreated(playlist: LocalPlaylist): void;
  playlistRenamed(id: string, name: string): void;
  playlistDeleted(id: string): void;
  playlistSongAdded(playlistId: string, song: AppSong): void;
  playlistSongRemoved(playlistId: string, songId: string): void;
  preferences(): void;
}

const noop = () => {};

export const sync: SyncApi = {
  likeAdded: noop,
  likeRemoved: noop,
  savedAdded: noop,
  savedRemoved: noop,
  playlistCreated: noop,
  playlistRenamed: noop,
  playlistDeleted: noop,
  playlistSongAdded: noop,
  playlistSongRemoved: noop,
  preferences: noop,
};

/** Called once by `sync.ts` at boot to wire the real cloud-sync implementations. */
export function registerSync(api: Partial<SyncApi>): void {
  Object.assign(sync, api);
}
