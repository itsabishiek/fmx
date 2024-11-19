import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { ALBUM_PLACEHOLDER } from "@/constants";
import { BottomModal, ModalContent } from "react-native-modals";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import { FontAwesome5 } from "@expo/vector-icons";
import { usePlayerContext } from "@/contexts/PlayerContext";
import Ionicons from "@expo/vector-icons/Ionicons";

interface BottomPlayerType {}

const BottomPlayer: React.FC<BottomPlayerType> = ({}) => {
  const [modalVisible, setModalVisible] = useState<any>(false);
  const { currentTrack, play, isPlaying, isLoading, playpause } =
    usePlayerContext();

  const artists = currentTrack?.track?.artists
    ?.map((artist: any) => artist?.name)
    ?.join(", ");

  const playTrack = async () => {
    await play(currentTrack);
  };

  return (
    <>
      <Pressable
        className={`absolute bottom-0 left-0 w-full h-[75] p-5 flex items-center justify-center`}
        onPress={() => setModalVisible(true)}
      >
        <View className="bg-accent/95 mb-5 p-3 w-full h-[70px] flex flex-row items-center justify-between rounded-lg">
          <View className="flex flex-row items-center justify-between w-full">
            <Image
              source={{
                uri:
                  currentTrack?.track?.album?.images[0]?.url ||
                  ALBUM_PLACEHOLDER,
              }}
              className="w-[50px] h-[50px] mr-2"
            />
            <View className="">
              <Text
                className="text-white font-semibold text-[17px]"
                numberOfLines={1}
              >
                {currentTrack?.track?.name?.length > 28
                  ? `${currentTrack?.track?.name?.slice(0, 28)}...`
                  : currentTrack?.track?.name}
              </Text>
              <Text className="text-gray-300 font-semibold text-[15px]">
                {currentTrack?.track?.artists?.[0]?.name}
              </Text>
            </View>

            <View>
              <Pressable
                className="w-[50px] h-[50px] flex items-center justify-center"
                onPress={playpause}
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
          </View>
        </View>
      </Pressable>

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
            backgroundColor: "#5072A7",
          }}
        >
          <View className="mt-8 mb-8">
            <View className="h-full w-full flex justify-between ">
              <View className="flex flex-row items-center justify-between">
                <Pressable onPress={() => setModalVisible(false)}>
                  <AntDesign name="down" size={24} color="white" />
                </Pressable>
                <Text className="text-white font-semibold text-xl">
                  Now Playing
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Entypo name="dots-three-vertical" size={24} color="white" />
                </Pressable>
              </View>

              <View>
                <Image
                  source={{
                    uri:
                      currentTrack?.track?.album?.images[0]?.url ||
                      ALBUM_PLACEHOLDER,
                  }}
                  className="h-[350px] w-full rounded-md"
                />
                <Text
                  className="text-white text-center mt-3 font-semibold text-xl"
                  numberOfLines={1}
                >
                  {currentTrack?.track?.name}
                </Text>
                <Text className="text-gray-300 text-center mt-1 font-semibold text-[16px]">
                  {artists}
                </Text>
              </View>

              <View className="flex flex-row items-center justify-between">
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="shuffle" size={30} color="white" />
                </Pressable>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="play-skip-back" size={30} color="white" />
                </Pressable>
                <Pressable
                  className="w-[65px] h-[65px] flex items-center justify-center bg-white/50 rounded-full"
                  onPress={playTrack}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size={32} />
                  ) : (
                    <>
                      {isPlaying ? (
                        <FontAwesome5 name="pause" size={30} color="white" />
                      ) : (
                        <FontAwesome5 name="play" size={30} color="white" />
                      )}
                    </>
                  )}
                </Pressable>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="play-skip-forward" size={30} color="white" />
                </Pressable>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="repeat" size={30} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </ModalContent>
      </BottomModal>
    </>
  );
};

export default BottomPlayer;
