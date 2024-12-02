import { View, Text, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import Container from "@/components/Container";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import LoaderScreen from "@/components/LoaderScreen";
import AntDesign from "@expo/vector-icons/AntDesign";
import { ALBUM_PLACEHOLDER, AVATAR_PLACEHODER } from "@/constants";
import { LinearGradient } from "expo-linear-gradient";
import TrackSkeleton from "@/components/skeleton/TrackSkeleton";

const Profile = () => {
  const [userData, setUserData] = useState<any>();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchUserProfile Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      setUserData(data);
    } catch (error) {
      console.log("fetchUserProfile Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPlaylists = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchUserPlaylists Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      setPlaylists(data?.items);
    } catch (error) {
      console.log("fetchUserPlaylists Error", error);
    } finally {
      setIsPlaylistLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("expiresIn");

      const logoutUrl = "https://accounts.spotify.com/en/logout";
      await WebBrowser.openBrowserAsync(logoutUrl);

      router.push("/");
    } catch (error) {
      console.log("onLogout Error", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserPlaylists();
  }, []);

  if (isLoading) {
    return <LoaderScreen isLoading={isLoading} />;
  }

  return (
    <Container>
      <View className="p-5 mb-[60px]">
        <Text className="text-2xl font-semibold mb-3 text-white">
          My Profile
        </Text>
        <View className="flex flex-row items-center justify-between mt-2">
          <View className="flex-row items-center">
            <Image
              source={{
                uri:
                  userData?.images?.length > 0
                    ? userData.images[0]?.url
                    : AVATAR_PLACEHODER,
              }}
              className="w-[60px] h-[60px] rounded-full mr-2"
            />
            <View>
              <Text className="text-white text-2xl font-bold">
                {userData?.display_name}
              </Text>
              <Text className="text-gray-400 text-xl font-bold">
                {userData?.email}
              </Text>
            </View>
          </View>
          <Pressable>
            <AntDesign
              name="logout"
              size={24}
              color="white"
              onPress={onLogout}
            />
          </Pressable>
        </View>

        <View>
          <Text className="text-[22px] font-semibold mt-5 mb-5 text-white">
            Playlists
          </Text>

          <View>
            <Pressable
              className={`flex flex-row flex-1 items-center mr-2 rounded-md mb-3`}
              onPress={() => router.push("/liked")}
            >
              <LinearGradient
                colors={["#fd356d", "#a549d0"]}
                className="mr-2 rounded-md"
              >
                <View className="w-[55px] h-[55px] flex-row items-center justify-center">
                  <AntDesign name="heart" size={26} color="white" />
                </View>
              </LinearGradient>
              <Text className="text-white text-lg font-bold">Liked Songs</Text>
            </Pressable>

            {isPlaylistLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TrackSkeleton key={i} />
                ))}
              </>
            ) : (
              <>
                {playlists
                  ?.filter((item) => item !== null)
                  ?.map((playlist, index) => (
                    <Pressable
                      key={index}
                      className="flex flex-row items-center mb-3"
                      onPress={() =>
                        router.push({
                          pathname: `/playlist/${playlist?.id}` as any,
                          params: {
                            playlistImg: playlist?.images[0].url,
                            playlistName: playlist?.name,
                            ownerName: playlist?.owner?.display_name,
                            description: playlist?.description,
                          },
                        })
                      }
                    >
                      <Image
                        source={{
                          uri: playlist?.images[0]?.url || ALBUM_PLACEHOLDER,
                        }}
                        className="w-[55px] h-[55px] mr-2 rounded"
                      />

                      <View>
                        <Text className="text-white text-lg font-bold">
                          {playlist?.name}
                        </Text>
                        <Text className="text-gray-400 font-bold">
                          {playlist?.owner?.display_name}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </>
            )}
          </View>
        </View>
      </View>
    </Container>
  );
};

export default Profile;
