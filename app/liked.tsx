import ParallaxScrollView from "@/components/ParallexScrollview";
import Track from "@/components/Track";
import TrackMenu from "@/components/TrackMenu";
import TrackSkeleton from "@/components/skeleton/TrackSkeleton";
import { usePlayerContext } from "@/contexts/PlayerContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { State } from "react-native-track-player";

const LikedTracks = () => {
  const {
    currentTrack,
    setCurrentTrack,
    play,
    isLoading,
    playpause,
    playBackState,
    setQueue,
    isTrackMenuVisible,
    setIsTrackMenuVisible,
  } = usePlayerContext();
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [isLoadingTrack, setIsLoadingTrack] = useState(true);

  const fetchLikedSongs = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchLikedSongs Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      setLikedSongs(data?.items);
      setQueue(data?.items);
    } catch (error) {
      console.log("fetchLikedSongs Error", error);
    } finally {
      setIsLoadingTrack(false);
    }
  };

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  const playTrack = async () => {
    if (currentTrack) {
      playpause();
    } else {
      if (likedSongs.length > 0) {
        setCurrentTrack(likedSongs[0]);
      }

      await play(likedSongs[0]);
    }
  };

  return (
    <>
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
              <Text className="text-gray-300 text-[17px]">
                Your loved tracks
              </Text>
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
              <FontAwesome5
                name={playBackState.state === State.Playing ? "pause" : "play"}
                size={24}
                color="white"
              />
            )}
          </Pressable>
        </View>

        <View className="">
          {isLoadingTrack ? (
            <>
              {Array.from({ length: 12 }).map((_, i) => (
                <TrackSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              {likedSongs?.length > 0 ? (
                <>
                  {likedSongs
                    ?.filter((obj) => obj?.track?.name !== "")
                    ?.map((song, index) => (
                      <Track key={index} item={song} index={index} />
                    ))}
                </>
              ) : (
                <View className="h-screen flex items-center justify-center">
                  <Text className="text-white text-[17px]">
                    No Songs found!
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ParallaxScrollView>

      <TrackMenu
        isTrackMenuVisible={isTrackMenuVisible}
        setIsTrackMenuVisible={setIsTrackMenuVisible}
      />
    </>
  );
};

export default LikedTracks;
