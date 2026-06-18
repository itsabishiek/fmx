import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { palette } from '@/theme';
import { setupPlayer } from '@/player/setup';
import { GlobalSheets } from '@/components/GlobalSheets';
import { GlobalMiniPlayer } from '@/components/MiniPlayer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent,
    background: palette.background,
    card: palette.background,
    text: palette.textPrimary,
    border: palette.border,
  },
};

export default function RootLayout() {
  useEffect(() => {
    // Warm up the player early so the first play is instant.
    setupPlayer().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navTheme}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.background },
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="player"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="queue" options={{ presentation: 'modal' }} />
              <Stack.Screen name="album/[id]" />
              <Stack.Screen name="artist/[id]" />
              <Stack.Screen name="playlist/[id]" />
              <Stack.Screen name="local-playlist/[id]" />
            </Stack>
            <GlobalMiniPlayer />
            <GlobalSheets />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
