import Container from "@/components/Container";
import LoaderScreen from "@/components/LoaderScreen";
import ArtistCard from "@/components/cards/ArtistCart";
import TrackCard from "@/components/cards/TrackCard";
import { ALBUM_PLACEHOLDER, AVATAR_PLACEHODER } from "@/constants";
import { greetingMessage } from "@/utils";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>();
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      setUserData(data);
      setIsLoading(false);
    } catch (error) {
      console.log("fetchUserProfile Error", error);
    }
  };

  const fetchRecentlyPlayedSongs = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=10",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await res.json();
      setRecentlyPlayed(data?.items);
    } catch (error) {
      console.log("fetchRecentlyPlayedSongs Error", error);
    }
  };

  const fetchTopArtists = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await fetch("https://api.spotify.com/v1/me/top/artists", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      setTopArtists(data?.items);
    } catch (error) {
      console.log("fetchTopArtists Error", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchRecentlyPlayedSongs();
    fetchTopArtists();
  }, []);

  if (isLoading) {
    return <LoaderScreen isLoading={isLoading} />;
  }

  return (
    <Container>
      <View className="p-3 pt-2 mb-5">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-accent font-semibold text-base">
              {greetingMessage()}
            </Text>
            <Text className="text-white text-2xl font-bold">
              {userData?.display_name}!
            </Text>
          </View>

          <Image
            source={{
              uri:
                userData?.images?.length > 0
                  ? userData.images[0]?.url
                  : AVATAR_PLACEHODER,
            }}
            className="w-[45px] h-[45px] rounded-full"
          />
        </View>

        <View className="mt-5 flex-row">
          <Pressable
            className={`bg-secondary flex flex-row flex-1 items-center mr-2 rounded-md mb-3`}
            onPress={() => router.push("/liked")}
          >
            <LinearGradient
              colors={["#fd356d", "#a549d0"]}
              className="mr-2 rounded-md"
            >
              <View className="w-[70px] h-[70px] flex-row items-center justify-center">
                <AntDesign name="heart" size={26} color="white" />
              </View>
            </LinearGradient>
            <Text className="text-white flex-1 font-semibold" numberOfLines={2}>
              Liked Songs
            </Text>
          </Pressable>

          <Pressable
            className={`bg-secondary flex flex-row flex-1 items-center mr-2 rounded-md mb-3`}
          >
            <Image
              source={{
                uri:
                  recentlyPlayed[0]?.track?.album?.images[0]?.url ||
                  ALBUM_PLACEHOLDER,
              }}
              className="w-[70px] h-[70px] rounded-md mr-2"
            />
            <Text className="text-white flex-1 font-semibold" numberOfLines={2}>
              {recentlyPlayed[0]?.track?.name}
            </Text>
          </Pressable>
        </View>

        <View>
          <FlatList
            data={recentlyPlayed?.slice(1, 3)}
            renderItem={renderRecentlyPlayed}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
          />
        </View>

        <View className="mt-2">
          <Text className="text-white text-[22px] font-semibold mb-3">
            Top Artists
          </Text>
          <FlatList
            horizontal={true}
            data={topArtists}
            renderItem={({ item, index }) => (
              <ArtistCard key={index} item={item} />
            )}
          />
        </View>

        <View className="mt-4">
          <Text className="text-white text-[22px] font-semibold mb-3">
            Recently Played
          </Text>
          <FlatList
            horizontal={true}
            data={recentlyPlayed}
            renderItem={({ item, index }) => (
              <TrackCard key={index} item={item} />
            )}
          />
        </View>
      </View>
    </Container>
  );
}

const renderRecentlyPlayed = ({
  item,
  index,
}: {
  item: any;
  index: number;
}) => {
  return (
    <Pressable
      key={index}
      className={`bg-secondary flex flex-row flex-1 items-center mr-2 rounded-md mb-3`}
    >
      <Image
        source={{
          uri: item?.track?.album?.images[0]?.url || ALBUM_PLACEHOLDER,
        }}
        className="w-[70px] h-[70px] rounded-md mr-2"
      />
      <Text className="text-white flex-1 font-semibold" numberOfLines={2}>
        {item?.track?.name}
      </Text>
    </Pressable>
  );
};
