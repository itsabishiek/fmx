import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  RatingType,
} from 'react-native-track-player';
import { palette } from '@/theme';

let setupPromise: Promise<void> | null = null;

/**
 * Idempotently initialise track-player. Safe to call from multiple places — the
 * underlying setup only runs once. Configures background playback, lock-screen /
 * notification controls and the capabilities the FMX UI exposes.
 */
export async function setupPlayer(): Promise<void> {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
        iosCategory: IOSCategory.Playback,
        iosCategoryMode: IOSCategoryMode.Default,
      });
    } catch (e) {
      // "player already initialized" — fine, treat as ready.
      const msg = (e as Error)?.message ?? '';
      if (!/already/i.test(msg)) {
        setupPromise = null;
        throw e;
      }
    }

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      ratingType: RatingType.Heart,
      // White monochrome bolt shown as the notification / lock-screen small icon (Android tints it).
      icon: require('../../assets/images/notification-icon.png'),
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      progressUpdateEventInterval: 1,
      color: parseInt(palette.accent.replace('#', ''), 16),
    });
  })();

  return setupPromise;
}

export function isPlayerSetup(): boolean {
  return setupPromise !== null;
}
