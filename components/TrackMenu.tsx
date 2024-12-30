import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { BottomModal, ModalContent } from "react-native-modals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-root-toast";
import { usePlayerContext } from "@/contexts/PlayerContext";
import { AntDesign } from "@expo/vector-icons";
import { Image } from "react-native";
import { ALBUM_PLACEHOLDER } from "@/constants";
import TrackSkeleton from "./skeleton/TrackSkeleton";

interface TrackMenuProps {
  isTrackMenuVisible: boolean;
  setIsTrackMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const TrackMenu: React.FC<TrackMenuProps> = ({
  isTrackMenuVisible,
  setIsTrackMenuVisible,
}) => {
  const { selectedTrackId } = usePlayerContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);

  const addTrackToPlaylist = async (playlistId: string) => {
    try {
      setIsLoading(true);

      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            uris: [selectedTrackId],
            position: 0,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("addTrackToPlaylist Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      Toast.show("Item added to the playlist!");
      setModalVisible(false);
      setIsTrackMenuVisible(false);
    } catch (error: any) {
      console.log("addTrackToPlaylist Error", error?.message);
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

  useEffect(() => {
    fetchUserPlaylists();
  }, []);

  // console.log("uri", selectedTrackId);
  // console.log("playlistId", playlists[0]?.id);

  return (
    <>
      <BottomModal
        visible={isTrackMenuVisible}
        // @ts-ignore
        onHardwareBackPress={() => setIsTrackMenuVisible(false)}
        swipeDirection={["up", "down"]}
        onSwipeOut={() => setIsTrackMenuVisible(false)}
        swipeThreshold={200}
      >
        <ModalContent
          style={{
            height: 160,
            width: "100%",
            backgroundColor: "#19191c",
          }}
        >
          <View className="h-full w-full">
            <TouchableOpacity
              className="p-4 flex items-center mb-2"
              onPress={() => setModalVisible(true)}
            >
              <Text className="text-white font-semibold">Add to playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4 flex items-center"
              onPress={() => setIsTrackMenuVisible(false)}
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ModalContent>
      </BottomModal>

      <BottomModal
        visible={modalVisible}
        // @ts-ignore
        onHardwareBackPress={() => setModalVisible(false)}
        swipeDirection={["up", "down"]}
        onSwipeOut={() => setModalVisible(false)}
        swipeThreshold={200}
      >
        <ModalContent
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: "#19191c",
          }}
        >
          <ScrollView className="mt-8 mb-8 h-full w-full">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-semibold text-white">
                Choose the playlist
              </Text>
              <Pressable onPress={() => setModalVisible(false)} className="">
                <AntDesign name="close" size={24} color="white" />
              </Pressable>
            </View>

            <View className="mt-4">
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
                        className={`flex flex-row items-center mb-3 ${
                          isLoading ? "opacity-25" : ""
                        }`}
                        onPress={() => addTrackToPlaylist(playlist?.id)}
                        disabled={isLoading}
                      >
                        <Image
                          source={{
                            uri:
                              playlist?.images?.[0]?.url ?? ALBUM_PLACEHOLDER,
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
          </ScrollView>
        </ModalContent>
      </BottomModal>
    </>
  );
};

export default TrackMenu;
