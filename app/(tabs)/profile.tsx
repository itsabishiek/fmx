import { View, Text, Button } from "react-native";
import React from "react";
import Container from "@/components/Container";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const Profile = () => {
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

  return (
    <Container>
      <View className="flex h-screen items-center justify-center">
        <Text className="text-3xl font-semibold mb-3 text-white">Profile</Text>
        <Button title="Logout" color="#fd356d" onPress={onLogout} />
      </View>
    </Container>
  );
};

export default Profile;
