import PlayerContextProvider from "@/contexts/PlayerContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { ModalPortal } from "react-native-modals";
import "react-native-reanimated";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PlayerContextProvider>
      <View className="flex-1 relative">
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "#19191c",
            },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="liked" />
          <Stack.Screen name="album/[albumId]/index" />
        </Stack>
      </View>

      <ModalPortal />
    </PlayerContextProvider>
  );
}
