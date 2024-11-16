import { usePlayerContext } from "@/contexts/PlayerContext";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomPlayer from "./BottomPlayer";

const Container = ({ children }: { children: React.ReactNode }) => {
  const { currentTrack } = usePlayerContext();

  return (
    <SafeAreaView className="bg-primary relative flex-1">
      <ScrollView>{children}</ScrollView>

      {currentTrack && <BottomPlayer />}

      <StatusBar backgroundColor="transparent" style="light" />
    </SafeAreaView>
  );
};

export default Container;
