import PlayerContextProvider from "@/contexts/PlayerContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { ModalPortal } from "react-native-modals";
import "react-native-reanimated";
import "react-native-root-siblings";
import { RootSiblingParent } from "react-native-root-siblings";

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
      <RootSiblingParent>
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
            <Stack.Screen name="playlist/[playlistId]/index" />
            <Stack.Screen name="artist/[artistId]/index" />
          </Stack>
        </View>

        <ModalPortal />
      </RootSiblingParent>
    </PlayerContextProvider>
  );
}
