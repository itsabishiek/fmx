import ParallaxScrollView from "@/components/ParallexScrollview";
import Track from "@/components/Track";
import TrackSkeleton from "@/components/skeleton/TrackSkeleton";
import { usePlayerContext } from "@/contexts/PlayerContext";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { State } from "react-native-track-player";

const ArtistTracks = () => {
  const { artistId, artistImg, artistName, genres } = useLocalSearchParams();
  const { setCurrentTrack, play, isLoading, playBackState, setQueue } =
    usePlayerContext();
  const [artistTracks, setArtistTracks] = useState<any[]>([]);
  const [isArtistLoading, setIsArtistLoading] = useState(true);

  const fetchArtistTracks = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchArtistTracks Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      setArtistTracks(data?.tracks);
      setQueue(data?.tracks);
    } catch (error) {
      console.log("fetchArtistTracks Error", error);
    } finally {
      setIsArtistLoading(false);
    }
  };

  useEffect(() => {
    fetchArtistTracks();
  }, []);

  const playTrack = async () => {
    if (artistTracks.length > 0) {
      setCurrentTrack(artistTracks[0]);
    }

    await play(artistTracks[0]);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor="#19191c"
      headerImage={
        <Image
          source={{ uri: artistImg as string }}
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
          {artistName}
        </Text>
        <Text className="text-gray-400 text-base mt-0.5 capitalize">
          {genres}
        </Text>
      </View>

      <View className="mt-4">
        {isArtistLoading ? (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            {artistTracks?.length > 0 ? (
              <>
                {artistTracks
                  ?.filter((obj) => obj?.track?.name !== "")
                  ?.map((song, index) => (
                    <Track key={index} item={song} index={index} />
                  ))}
              </>
            ) : (
              <View className="h-[50vh] flex items-center justify-center">
                <Text className="text-white text-[17px]">No Songs found!</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ParallaxScrollView>
  );
};

export default ArtistTracks;
