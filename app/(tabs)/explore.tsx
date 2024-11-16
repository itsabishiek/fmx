import Container from "@/components/Container";
import { useEffect } from "react";
import { Text, View } from "react-native";
import React, { useState } from "react";
import { Button, StyleSheet } from "react-native";
import { Audio } from "expo-av";

export default function Explore() {
  const [song, setSong] = useState<any>();

  const songName = "ordinary person";
  const artistName = "Anirudh Ravichander";

  const fetchSong = async () => {
    try {
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${songName} ${artistName}`,
        {
          method: "GET",
        }
      );

      const data = await res.json();

      console.log("Datas", data);
      setSong(data);
    } catch (error: any) {
      console.log("fetchSong Error", error);
    }
  };

  // useEffect(() => {
  //   fetchSong();
  // }, []);

  return (
    <Container>
      <View className="p-4 pt-2">
        <Text className="text-white text-2xl">Explore</Text>

        <AudioPlayer audioUrl={song?.data?.results?.[0]?.downloadUrl[3]?.url} />
      </View>
    </Container>
  );
}

const AudioPlayer = ({ audioUrl }: { audioUrl: any }) => {
  const [sound, setSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    try {
      // If sound is already loaded, play/pause it
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Load and play sound for the first time
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Clean up the sound object when component unmounts
  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <Button
        title={isPlaying ? "Pause Audio" : "Play Audio"}
        onPress={playAudio}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
