# CLAUDE.md — FMX

Guidance for working in this repository.

## What FMX is

**FMX** is an Apple Music–style music streaming app built with **Expo / React Native**. It streams
real, high-quality audio from the free, no-key **saavn (unofficial JioSaavn) API**. Dark theme built
around the accent **`#fd356d`**. Content focus: Tamil + Hindi, plus some English.

There is **no authentication** in this build. All user data (favorites, playlists, recently played,
search history, settings) is stored **locally on the device** via AsyncStorage — nothing is uploaded.

## Running the app

> ⚠️ **This app does NOT run in Expo Go.** It uses `react-native-track-player` (native module) for
> background playback and lock-screen/notification controls, so it requires a **development build**.

```bash
npm install

# Generate native projects (first time / after native config changes)
npx expo prebuild

# Build & launch a dev build on a connected device or emulator
npx expo run:android     # Android (Windows/macOS/Linux)
npx expo run:ios         # iOS (macOS only)

# …or use EAS
eas build --profile development
```

Then start Metro with `npx expo start --dev-client`.

Useful checks:
- `npx tsc --noEmit` — type-check (must stay clean).
- `npx expo export --platform android` — JS bundle smoke test (no device needed).

### New Architecture & the track-player patch
SDK 56 / RN 0.85 ship the **New Architecture** enabled (and it can't be disabled — Reanimated 4
requires it). track-player is a *headless* native module (playback service + native module, no Fabric
UI views), so it runs fine on the new arch via the interop layer **at runtime**.

`react-native-track-player@4.1.2` needs **two** fixes to work on RN 0.85's New Architecture, both
applied via a **patch-package** patch at `patches/react-native-track-player+4.1.2.patch` (and the
`postinstall: patch-package` script reapplies it after every `npm install` — do **not** remove it):

1. **Compile fix:** `MusicModule.kt` (`getTrack`, `getActiveTrack`) passed a now-nullable `Bundle?`
   into `Arguments.fromBundle(Bundle)`, which fails RN 0.85's stricter Kotlin signatures → null-safe
   `?.let { Arguments.fromBundle(it) }`.
2. **Runtime fix (the "Exception in HostObject::get for prop 'TrackPlayerModule'" crash):** every
   `@ReactMethod` in `MusicModule.kt` was an expression body `= scope.launch { … }`, so each returned
   `kotlinx.coroutines.Job`. The New-Architecture TurboModule-interop parser requires bridge methods to
   return `void`, and throws `TurboModuleInteropUtils$ParsingException: ... unsupported return class:
   kotlinx.coroutines.Job` at startup. Fix: convert each to a block body `{ scope.launch { … } }` so it
   returns `Unit`.

If you ever bump track-player, re-check whether this patch still applies — a future RNTP release (e.g.
the v5 Nitro rewrite) may add first-class New-Architecture support and make it unnecessary.

## The API — `https://saavn.sumit.co/api`

Base URL lives in `src/api/client.ts` (`API_BASE`). The docs advertise `https://saavn.dev/api`, but
that host does **not resolve on all networks** — `saavn.sumit.co` is the same API and is the default.
Both are interchangeable; swap if one is down. No key required; CORS open; send a browser-like UA.

Every response is `{ success, data }`; `apiGet()` unwraps `data` and throws `ApiError` on failure.

Endpoints used (`src/api/endpoints.ts`):
| Function | Endpoint |
|---|---|
| `searchAll` | `/search?query=` (global top results) |
| `searchSongs/Albums/Artists/Playlists` | `/search/{type}?query=&page=&limit=` (paginated) |
| `getSong` | `/songs/{id}` (full song incl. `downloadUrl[]`) |
| `getSongSuggestions` | `/songs/{id}/suggestions?limit=` (Autoplay/radio) |
| `getLyrics` | `/songs/{id}/lyrics` |
| `getAlbum` | `/albums?id=` |
| `getArtist` | `/artists/{id}` |
| `getPlaylist` | `/playlists?id=&page=&limit=` |

**Key data facts** (see `src/api/types.ts`, `normalize.ts`):
- Song artwork comes as `image[]` at `50x50 / 150x150 / 500x500`. `pickImage()` selects.
- Audio comes as `downloadUrl[]` at `12/48/96/160/320 kbps` (`.mp4`/AAC, directly streamable).
  `pickStreamUrl()` selects by the user's quality setting (default 320kbps).
- Titles contain HTML entities (`&quot;` etc.) — always run them through `decodeEntities()`.
- There is **no native home-feed endpoint**. The Home screen is assembled from curated, **validated**
  JioSaavn playlist IDs in `src/constants/homeFeed.ts`.

## Architecture

Router root is **`src/app/`** (Expo Router, file-based). Path alias **`@/*` → `src/*`**.
Custom entry **`index.js`** registers the track-player playback service before `expo-router/entry`.

```
src/
├── app/                      # Expo Router routes
│   ├── _layout.tsx           # Providers: QueryClient, GestureHandler, SafeArea, nav theme, Stack + GlobalSheets
│   ├── (tabs)/               # index (Home), browse, search, library  (+ custom TabBar w/ mini-player)
│   ├── album/[id], artist/[id], playlist/[id], local-playlist/[id]
│   ├── category/[key]        # Browse category → playlist grid
│   ├── favorites             # Liked songs
│   ├── player                # Now Playing (modal) + lyrics
│   └── queue                 # Up Next (modal)
├── api/        client · endpoints · types · normalize
├── hooks/      queries.ts    # all react-query hooks
├── player/     setup · service · controls · track · usePlayer · playbackStore
├── store/      libraryStore · historyStore · settingsStore · uiStore · storage  (zustand + persist)
├── components/ AppText · Artwork · SongRow · MediaCard · HorizontalShelf · SongShelf · MiniPlayer
│               · TabBar · CollectionHeader · Seekbar · GlobalSheets · states
├── constants/  homeFeed.ts   # curated playlist IDs + browse categories
└── theme/      colors · index (spacing/radius/typography/layout)
```

### State & data
- **Server state:** TanStack Query (`src/hooks/queries.ts`). Infinite queries power search pagination.
- **Persistent client state:** zustand + `persist` (AsyncStorage), keys namespaced `fmx:*`:
  - `libraryStore` — favorites, user playlists (CRUD), saved albums/artists/playlists.
  - `historyStore` — recently played (capped) + recent searches.
  - `settingsStore` — audio quality, autoplay toggle.
- **Runtime (non-persisted):** `playbackStore` mirrors the track-player queue as full `AppSong`s
  (by id) so the UI can like/navigate/show artwork; `uiStore` drives the global sheets.

### Player (react-native-track-player)
- `setup.ts` — idempotent init + capabilities (play/pause/next/prev/seek/stop), lock-screen color.
- `service.ts` — remote events (lock screen / notification / headset), history tracking, **Autoplay**
  (on `PlaybackQueueEnded`, fetch `/suggestions` and extend the queue).
- `controls.ts` — high-level API the UI calls: `playSongList`, `playSong`, `playNext`, `addToQueue`,
  `togglePlayback`, `skipToNext/Previous`, `seekTo`, `cycleRepeatMode`, `toggleShuffle`,
  `removeFromQueue`, `clearQueue`.
- `track.ts` — `songToTrack()` builds an RNTP `Track` (extra fields like `songId` ride along).
- `usePlayer.ts` — UI hooks (`useCurrentSong`, `useProgress`, `useIsPlaying`, `useRepeatMode`, …).

## Conventions
- Components are functional + typed; styling via `StyleSheet.create` using `@/theme` tokens (never
  hard-code colors/spacing — add to the theme).
- All artwork via `expo-image` (`Artwork` component) for caching + placeholders.
- Use `@/theme`'s `layout.scrollBottomPad` as the bottom inset on scroll views so content clears the
  floating tab bar + mini-player.
- Navigate to content with the links: `/album/[id]`, `/artist/[id]`, `/playlist/[id]`,
  `/local-playlist/[id]`. `MediaCard` handles this via `navigateToCard()`.

## Known follow-ups (not in this build)
- Drag-to-reorder the queue (currently tap-to-jump + remove).
- Offline downloads, sleep timer, equalizer, CarPlay/Android Auto.
- Cross-device sync (would require auth + a backend).
