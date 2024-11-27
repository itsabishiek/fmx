import ParallaxScrollView from "@/components/ParallexScrollview";
import TrackSkeleton from "@/components/skeleton/TrackSkeleton";
import { usePlayerContext } from "@/contexts/PlayerContext";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { State } from "react-native-track-player";

const Album = () => {
  const { albumId, albumImg, trackName, artists } = useLocalSearchParams();
  const { setCurrentTrack, play, isLoading, playBackState, setQueue } =
    usePlayerContext();
  const [albumTracks, setAlbumTracks] = useState([]);
  const [isTrackLoading, setIsTrackLoading] = useState(true);

  const fetchAlbumTracks = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        `https://api.spotify.com/v1/albums/${albumId}/tracks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchAlbumTracks Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      setAlbumTracks(data?.items);
      setQueue(data?.items);
    } catch (error) {
      console.log("fetchAlbumTracks Error", error);
    } finally {
      setIsTrackLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbumTracks();
  }, []);

  const playTrack = async () => {
    if (albumTracks.length > 0) {
      setCurrentTrack(albumTracks[0]);
    }

    await play(albumTracks[0]);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor="#19191c"
      headerImage={
        <Image
          source={{ uri: albumImg as string }}
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

      <View className="">
        <Text className="text-white font-semibold text-[20px]">
          {trackName}
        </Text>
        <Text className="text-gray-400 text-base mt-0.5">{artists}</Text>

        <View className="mt-6">
          {isTrackLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <TrackSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              {albumTracks?.map((song: any, index) => {
                const playTrack = async () => {
                  setCurrentTrack({ ...song, albumImg });

                  await play({ ...song, albumImg });
                };

                return (
                  <Pressable
                    key={index}
                    className="mb-4 flex-row items-center justify-between"
                    onPress={playTrack}
                  >
                    <View className="flex-row items-center flex-1 w-full">
                      <Text className="text-white font-semibold text-[18px] mr-4">
                        {index + 1}.
                      </Text>

                      <View className="">
                        <Text
                          className="text-white font-semibold text-[17px]"
                          numberOfLines={1}
                        >
                          {song?.name?.length > 30
                            ? `${song?.name?.slice(0, 30)}...`
                            : song?.name}
                        </Text>
                        <Text className="text-gray-400 font-semibold text-[15px]">
                          {song?.artists?.[0]?.name}
                        </Text>
                      </View>
                    </View>

                    <Pressable>
                      <Entypo
                        name="dots-three-vertical"
                        size={24}
                        color="gray"
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </View>
    </ParallaxScrollView>
  );
};

export default Album;
