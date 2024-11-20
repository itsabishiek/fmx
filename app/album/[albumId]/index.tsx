import Container from "@/components/Container";
import ParallaxScrollView from "@/components/ParallexScrollview";
import Track from "@/components/Track";
import { usePlayerContext } from "@/contexts/PlayerContext";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

const Album = () => {
  const { albumId, albumImg, trackName, artists } = useLocalSearchParams();
  const { setCurrentTrack, play, isLoading, playBackState } =
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
        <Pressable className="bg-accent w-[60px] h-[60px] rounded-full flex items-center justify-center">
          <FontAwesome5 name={"play"} size={24} color="white" />
        </Pressable>
      </View>

      <View className="">
        <Text className="text-white font-semibold text-[20px]">
          {trackName}
        </Text>
        <Text className="text-gray-400 text-base mt-0.5">{artists}</Text>

        <View className="mt-6">
          {albumTracks?.map((song: any, index) => {
            const playTrack = async () => {
              setCurrentTrack(song);

              await play(song);
            };

            return (
              <Pressable
                key={index}
                className="mb-4 flex-row items-center justify-between"
                onPress={playTrack}
              >
                <View className="flex-row items-center flex-1 w-full">
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
                  <Entypo name="dots-three-vertical" size={24} color="gray" />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ParallaxScrollView>
  );
};

export default Album;
