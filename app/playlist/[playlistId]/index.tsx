import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ParallaxScrollView from "@/components/ParallexScrollview";
import { FontAwesome5 } from "@expo/vector-icons";
import { usePlayerContext } from "@/contexts/PlayerContext";
import TrackSkeleton from "@/components/skeleton/TrackSkeleton";
import Track from "@/components/Track";
import { State } from "react-native-track-player";

const Playlist = () => {
  const { playlistId, playlistImg, playlistName, ownerName, description } =
    useLocalSearchParams();
  const { setCurrentTrack, play, isLoading, playBackState, setQueue } =
    usePlayerContext();
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);

  const fetchPlaylist = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchPlaylist Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      setPlaylistTracks(data?.items);
      setQueue(data?.items);
    } catch (error) {
      console.log("fetchPlaylist Error", error);
    } finally {
      setIsPlaylistLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, []);

  const playTrack = async () => {
    if (playlistTracks.length > 0) {
      setCurrentTrack(playlistTracks[0]);
    }

    await play(playlistTracks[0]);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor="#19191c"
      headerImage={
        <Image
          source={{ uri: playlistImg as string }}
          className="absolute bottom-0 left-0 h-full w-full"
          resizeMode="cover"
        />
      }
    >
      <View className="absolute top-[-35px] right-5">
        <Pressable
          className="bg-accent w-[60px] h-[60px] rounded-full flex items-center justify-center"
          onPress={playTrack}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size={28} />
          ) : (
            <FontAwesome5
              name={playBackState.state === State.Playing ? "pause" : "play"}
              size={24}
              color="white"
            />
          )}
        </Pressable>
      </View>

      <View>
        <Text className="text-white font-semibold text-[20px]">
          {playlistName}
        </Text>
        <Text className="text-gray-400 text-base mt-0.5">{ownerName}</Text>
      </View>

      <View className="mt-4">
        {isPlaylistLoading ? (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            {playlistTracks?.length > 0 ? (
              <>
                {playlistTracks
                  ?.filter((obj) => obj?.track !== null)
                  ?.map((song, index) => (
                    <Track key={index} item={song} />
                  ))}
              </>
            ) : (
              <View className="h-screen flex items-center justify-center">
                <Text className="text-white text-[17px]">No Songs found!</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ParallaxScrollView>
  );
};

export default Playlist;
