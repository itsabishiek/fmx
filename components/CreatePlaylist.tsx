import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";

interface CreatePlaylistProps {
  userData: any;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreatePlaylist: React.FC<CreatePlaylistProps> = ({
  userData,
  setModalVisible,
}) => {
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createUserPlaylist = async () => {
    try {
      setIsCreating(true);

      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        `https://api.spotify.com/v1/users/${userData?.id}/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: playlistName,
            description: playlistDesc,
            public: false,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text(); // Attempt to get the error message
        console.log("createUserPlaylist Error:", errorText);
        throw new Error(`HTTP Error: ${res.status}`);
      }

      Toast.show("Playlist created successfully!");
      setModalVisible(false);
      setPlaylistName("");
      setPlaylistDesc("");
    } catch (error: any) {
      console.log("createUserPlaylist Error", error?.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View className="mt-4 mb-4 h-full w-full">
      <View className="flex flex-row items-center justify-between mb-3">
        <Text className="text-2xl font-semibold text-white">My Profile</Text>
        <Pressable onPress={() => setModalVisible(false)} className="">
          <AntDesign name="close" size={24} color="white" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        className="flex-1"
      >
        <View className="mt-4 flex">
          <View
            className={`w-full h-14 px-4 bg-secondary rounded-md focus:border-accent flex flex-row items-center mb-4`}
          >
            <TextInput
              className="flex-1 h-full text-white font-psemibold text-base placeholder:text-gray-400"
              placeholder="Playlist Name"
              placeholderTextColor="#555658"
              value={playlistName}
              onChangeText={(text) => setPlaylistName(text)}
            />
          </View>
          <View
            className={`w-full h-14 px-4 bg-secondary rounded-md focus:border-accent flex flex-row items-center`}
          >
            <TextInput
              className="flex-1 h-full text-white font-psemibold text-base placeholder:text-gray-400"
              placeholder="Playlist Description"
              placeholderTextColor="#555658"
              value={playlistDesc}
              onChangeText={(text) => setPlaylistDesc(text)}
            />
          </View>

          <TouchableOpacity
            className={`w-full p-4  flex items-center mt-5 rounded-md ${
              isCreating ? "bg-accent/40" : "bg-accent"
            }`}
            disabled={isCreating}
            onPress={createUserPlaylist}
          >
            <Text className="text-white font-semibold">Create Playlist</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreatePlaylist;
