import Container from "@/components/Container";
import Track from "@/components/Track";
import TrackMenu from "@/components/TrackMenu";
import TrackSkeleton from "@/components/skeleton/TrackSkeleton";
import { ALBUM_PLACEHOLDER } from "@/constants";
import { usePlayerContext } from "@/contexts/PlayerContext";
import { Entypo } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";

export default function Explore() {
  const {
    setCurrentTrack,
    play,
    isTrackMenuVisible,
    setIsTrackMenuVisible,
    setSelectedTrackId,
  } = usePlayerContext();
  const [searchQ, setSearchQ] = useState("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [type, setType] = useState("track");

  const fetchSearchResults = async (searchTerm: string) => {
    try {
      setIsSearching(true);

      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${searchTerm}&type=${type}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("fetchSearchResults Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      if (type === "track") {
        setSearchResult(data?.tracks?.items);
      } else if (type === "album") {
        setSearchResult(data?.albums?.items);
      } else {
        setSearchResult(data?.playlists?.items);
      }
    } catch (error) {
      console.log("fetchSearchResults Error", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchQ) {
      fetchSearchResults(searchQ);
    }
  }, [type]);

  return (
    <>
      <Container>
        <View className="p-5 mb-[60px]">
          <Text className="text-2xl font-semibold mb-3 text-white">
            Explore
          </Text>
          <TextInput
            className="flex-1 w-full h-14 px-4 bg-secondary rounded-md text-white font-psemibold text-base placeholder:text-gray-400"
            placeholder="Search"
            placeholderTextColor="#555658"
            autoFocus
            value={searchQ}
            onChangeText={(e) => setSearchQ(e)}
            onSubmitEditing={() => {
              fetchSearchResults(searchQ);
            }}
            returnKeyType="go"
          />

          <View className="mt-4">
            {isSearching ? (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <TrackSkeleton key={i} />
                ))}
              </>
            ) : (
              <>
                {searchResult?.length > 0 ? (
                  <>
                    <View className="mb-4 flex-row items-center">
                      <Pressable
                        className={`${
                          type === "track" ? "bg-accent" : "bg-secondary-100"
                        }  w-fit mr-3 p-2 px-3 rounded-full`}
                        onPress={() => setType("track")}
                      >
                        <Text
                          className={`${
                            type === "track"
                              ? "text-white font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          Songs
                        </Text>
                      </Pressable>
                      <Pressable
                        className={`${
                          type === "album" ? "bg-accent" : "bg-secondary-100"
                        }  w-fit mr-3 p-2 px-3 rounded-full`}
                        onPress={() => setType("album")}
                      >
                        <Text
                          className={`${
                            type === "album"
                              ? "text-white font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          Albums
                        </Text>
                      </Pressable>
                      <Pressable
                        className={`${
                          type === "playlist" ? "bg-accent" : "bg-secondary-100"
                        }  w-fit mr-3 p-2 px-3 rounded-full`}
                        onPress={() => setType("playlist")}
                      >
                        <Text
                          className={`${
                            type === "playlist"
                              ? "text-white font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          Playlists
                        </Text>
                      </Pressable>
                    </View>

                    {searchResult?.map((res, index) => {
                      const playTrack = async () => {
                        setCurrentTrack(res);

                        await play(res);
                      };

                      const artists = res?.artists
                        ?.map((artist: any) => artist?.name)
                        ?.join(", ");

                      return (
                        <Pressable
                          key={index}
                          className="mb-4 flex-row items-center justify-between"
                          onPress={() => {
                            if (type === "track") {
                              playTrack();
                            } else if (type === "album") {
                              router.push({
                                pathname: `/album/${res?.id}` as any,
                                params: {
                                  albumImg: res?.images[0].url,
                                  trackName: res?.name,
                                  artists,
                                },
                              });
                            } else {
                              router.push({
                                pathname: `/playlist/${res?.id}` as any,
                                params: {
                                  playlistImg: res?.images[0].url,
                                  playlistName: res?.name,
                                  ownerName: res?.owner?.display_name,
                                },
                              });
                            }
                          }}
                        >
                          <View className="flex-row items-center flex-1 w-full">
                            <Image
                              source={{
                                uri:
                                  res?.album?.images[0]?.url ||
                                  res?.images[0]?.url ||
                                  ALBUM_PLACEHOLDER,
                              }}
                              className="w-[60px] h-[60px] rounded-md mr-2"
                            />
                            <View className="">
                              <Text
                                className="text-white font-semibold text-[17px]"
                                numberOfLines={1}
                              >
                                {res?.name?.length > 30
                                  ? `${res?.name?.slice(0, 30)}...`
                                  : res?.name}
                              </Text>
                              <Text className="text-gray-400 font-semibold text-[15px]">
                                {res?.type === "track"
                                  ? "Song"
                                  : res?.type === "album"
                                  ? "Album"
                                  : "Playlist"}
                                {res?.type !== "playlist"
                                  ? ` • ${res?.artists?.[0]?.name}`
                                  : ""}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              setIsTrackMenuVisible(true);
                              setSelectedTrackId(res?.track?.uri ?? res?.uri);
                            }}
                          >
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
                ) : null}
              </>
            )}
          </View>
        </View>
      </Container>

      <TrackMenu
        isTrackMenuVisible={isTrackMenuVisible}
        setIsTrackMenuVisible={setIsTrackMenuVisible}
      />
    </>
  );
}
