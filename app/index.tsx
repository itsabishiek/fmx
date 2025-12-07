import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Entypo from "@expo/vector-icons/Entypo";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import images from "../constants/assets";
import LoaderScreen from "@/components/LoaderScreen";

WebBrowser.maybeCompleteAuthSession();

// Endpoint
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const LoginScreen = () => {
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;
  const redirectUri = makeRedirectUri({
    scheme: "fmx",
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId as string,
      scopes: [
        "user-read-email",
        "user-read-private",
        "user-library-read",
        "user-library-modify",
        "user-read-recently-played",
        "user-top-read",
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-public",
        "playlist-modify-private",
      ],
      usePKCE: false,
      redirectUri: redirectUri,
    },
    discovery
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkTokenValidity = async () => {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const expiresIn = await AsyncStorage.getItem("expiresIn");

      if (accessToken && expiresIn && Date.now() < Number(expiresIn)) {
        router.push("/home");
      } else if (refreshToken) {
        // In this case, the access_token would be expired, so new access_token will be generated through refresh_token
        await fetchRefreshToken(refreshToken);
      }

      setIsLoading(false);
    };

    checkTokenValidity();
  }, []);

  const fetchAccessToken = async (code: string) => {
    try {
      if (!clientId || !clientSecret) {
        throw new Error(
          "Spotify credentials are missing. Please set EXPO_PUBLIC_SPOTIFY_CLIENT_ID and EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET in your .env file."
        );
      }

      const res = await fetch(discovery.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Spotify API Error:", data);
        throw new Error(
          data.error_description || data.error || "Failed to get access token"
        );
      }

      if (data?.access_token && data?.refresh_token) {
        const expiresIn = Date.now() + data.expires_in * 1000;

        await AsyncStorage.setItem("accessToken", data.access_token);
        await AsyncStorage.setItem("refreshToken", data.refresh_token);
        await AsyncStorage.setItem("expiresIn", expiresIn.toString());

        router.push("/home");
      }
    } catch (error: any) {
      console.error("fetchAccessToken Error", error);
      setError(error?.message || "Failed to authenticate with Spotify");
    }
  };

  const fetchRefreshToken = async (refreshToken: string) => {
    try {
      if (!clientId || !clientSecret) {
        throw new Error("Spotify credentials are missing.");
      }

      const res = await fetch(discovery.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Spotify Refresh Token Error:", data);
        throw new Error(
          data.error_description || data.error || "Failed to refresh token"
        );
      }

      if (data?.access_token) {
        const expiresIn = Date.now() + data.expires_in * 1000;

        await AsyncStorage.setItem("accessToken", data.access_token);
        await AsyncStorage.setItem("expiresIn", expiresIn.toString());

        if (data?.refresh_token) {
          await AsyncStorage.setItem("refresh_token", data.refresh_token);
        } else {
          await AsyncStorage.setItem("refreshToken", refreshToken);
        }

        router.push("/home");
      }
    } catch (error: any) {
      console.error("fetchRefreshToken Error", error);
      setError(error?.message || "Failed to refresh token");
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      setError(null);
      fetchAccessToken(code);
    } else if (response?.type === "error") {
      console.error("Auth Response Error:", response.error);
      setError(
        response.error?.message ||
          "Authentication failed. Please check your Spotify credentials and redirect URI configuration."
      );
    }
  }, [response]);

  if (isLoading) {
    return <LoaderScreen isLoading={isLoading} />;
  }

  return (
    <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
      <SafeAreaView>
        <View className="p-[60px] h-full justify-between items-center">
          <View className="items-center">
            <View className="flex-row items-center">
              <FontAwesome6 name="bolt-lightning" size={45} color="#fd356d" />
              <Text className="text-white text-5xl font-extrabold ml-3">
                FmX
              </Text>
            </View>
            <Text className="text-gray-400 italic text-center text-xl font-semibold mt-3">
              Tune In. Zone Out.
            </Text>
          </View>

          <View>
            <Image
              source={images.onboarding}
              className="w-[300px] h-[300px] "
            />
          </View>

          {error && (
            <View className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4 w-full">
              <Text className="text-red-300 text-center font-semibold">
                {error}
              </Text>
              <Text className="text-red-200 text-center text-sm mt-2">
                Check console for redirect URI and verify it matches your
                Spotify App settings.
              </Text>
            </View>
          )}

          {!clientId && (
            <View className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-4 w-full">
              <Text className="text-yellow-300 text-center font-semibold">
                Missing Spotify Client ID
              </Text>
              <Text className="text-yellow-200 text-center text-sm mt-2">
                Create a .env file with EXPO_PUBLIC_SPOTIFY_CLIENT_ID and
                EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET
              </Text>
            </View>
          )}

          <TouchableOpacity
            className="bg-accent flex flex-row items-center justify-center p-4 w-full rounded-full"
            onPress={() => {
              setError(null);
              promptAsync();
            }}
            disabled={!request || !clientId}
          >
            <Entypo name="spotify" size={28} color="white" />
            <Text className="text-primary font-bold ml-2 text-xl">
              Sign in with spotify
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <StatusBar backgroundColor="transparent" style="inverted" />
    </LinearGradient>
  );
};

export default LoginScreen;
