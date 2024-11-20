import { createContext, useContext, useEffect, useState } from "react";
import TrackPlayer, {
  State,
  Capability,
  usePlaybackState,
} from "react-native-track-player";

export const PlayerContext = createContext({});
export const usePlayerContext = () => useContext<any>(PlayerContext);

TrackPlayer.registerPlaybackService(() => require("../utils/services"));

const PlayerContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);

  const playBackState = usePlaybackState();

  const setupTrackPlayer = async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });
    } catch (error) {
      console.error("TrackPlayer setup error:", error);
    }
  };

  const play = async (song: any) => {
    try {
      setIsLoading(true);

      const songName = song?.track?.name || song?.name;
      const artistName =
        song?.track?.artists?.[0]?.name || song?.artists?.[0]?.name;

      if (!songName || !artistName) {
        console.error("Invalid song data.");
        return;
      }

      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${songName} ${artistName}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch song data: ${res.statusText}`);
      }

      const songData = await res.json();
      const audioURL = songData?.data?.results?.[0]?.downloadUrl?.[3]?.url;
      if (!audioURL) {
        console.error("No audio URL found.");
        return;
      }

      // Add the track to the queue
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: song?.track?.id,
        url: audioURL,
        title: songName,
        artist: artistName,
        artwork: song?.track?.album?.images?.[0]?.url || undefined, // Optional: album artwork
      });

      await TrackPlayer.play();
    } catch (error) {
      console.error("play Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playpause = async () => {
    if (playBackState.state === State.Playing) {
      await TrackPlayer.pause();
    } else if (playBackState.state === State.Paused) {
      await TrackPlayer.play();
    }
  };

  useEffect(() => {
    setupTrackPlayer();

    return () => {
      TrackPlayer.reset();
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        isLoading,
        setIsLoading,
        play,
        playpause,
        playBackState,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContextProvider;
