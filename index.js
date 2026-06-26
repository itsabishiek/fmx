// Polyfills required by supabase-js (gotrue): crypto.getRandomValues + a full
// URL/URLSearchParams implementation. These MUST load before anything that
// imports @supabase/supabase-js, so they sit at the very top of the entry file.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Custom entry point: register the track-player playback service BEFORE the
// Expo Router app boots, then hand off to expo-router/entry.
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/player/service';

TrackPlayer.registerPlaybackService(() => PlaybackService);

require('expo-router/entry');
