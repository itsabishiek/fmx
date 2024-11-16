import ParallaxScrollView from "@/components/ParallexScrollview";
import Track from "@/components/Track";
import { usePlayerContext } from "@/contexts/PlayerContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const LikedTracks = () => {
  const { setCurrentTrack, play, isPlaying, isLoading } = usePlayerContext();
  const [likedSongs, setLikedSongs] = useState<any[]>([]);

  const fetchLikedSongs = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      setLikedSongs(data?.items);
    } catch (error) {
      console.log("fetchLikedSongs Error", error);
    }
  };

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  const playTrack = async () => {
    if (likedSongs.length > 0) {
      setCurrentTrack(likedSongs[0]);
    }

    await play(likedSongs[0]);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor="#19191c"
      headerHeight={250}
      headerImage={
        <LinearGradient
          colors={["#fd356d", "#a43d5c", "#19191c"]}
          className="absolute bottom-0 left-0 h-full w-full"
        >
          <View className="p-4 mt-[100px]">
            <Text className="text-white font-semibold text-2xl">
              Liked Songs
            </Text>
            <Text className="text-gray-300 text-[17px]">50 Songs</Text>
          </View>
        </LinearGradient>
      }
    >
      <View className="absolute top-[-40px] right-5">
        <Pressable
          className="bg-accent w-[60px] h-[60px] rounded-full flex items-center justify-center"
          onPress={playTrack}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size={28} />
          ) : (
            <>
              {isPlaying ? (
                <FontAwesome5 name="pause" size={24} color="white" />
              ) : (
                <FontAwesome5 name="play" size={24} color="white" />
              )}
            </>
          )}
        </Pressable>
      </View>
      <View className="">
        {likedSongs
          ?.filter((obj) => obj?.track?.name !== "")
          ?.map((song, index) => (
            <Track key={index} item={song} />
          ))}
      </View>
    </ParallaxScrollView>
  );
};

export default LikedTracks;
