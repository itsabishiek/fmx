// Custom entry point: register the track-player playback service BEFORE the
// Expo Router app boots, then hand off to expo-router/entry.
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/player/service';

TrackPlayer.registerPlaybackService(() => PlaybackService);

require('expo-router/entry');
