import { createContext, useContext, useEffect, useRef, useState } from "react";
import TrackPlayer, {
  State,
  Capability,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
  Event,
} from "react-native-track-player";

export const PlayerContext = createContext({});
export const usePlayerContext = () => useContext<any>(PlayerContext);

TrackPlayer.registerPlaybackService(() => require("../utils/services"));

const PlayerContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState<any>();

  const playBackState = usePlaybackState();
  const progress = useProgress();
  const value = useRef(0);

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

  const playPreviousTrack = async () => {
    try {
      value.current -= 1;
      if (value.current < queue?.length) {
        const prevTrack = queue[value.current];
        setCurrentTrack(prevTrack);

        await play(prevTrack);
      } else {
        console.log("End of the playlist");
      }
    } catch (error) {
      console.log("playNextTrack Error", error);
    }
  };

  const playNextTrack = async () => {
    try {
      value.current += 1;
      if (value.current < queue?.length) {
        const nextTrack = queue[value.current];
        setCurrentTrack(nextTrack);

        await play(nextTrack);
      } else {
        console.log("End of the playlist");
      }
    } catch (error) {
      console.log("playNextTrack Error", error);
    }
  };

  useTrackPlayerEvents(
    [Event.PlaybackQueueEnded, Event.PlaybackTrackChanged],
    async (event) => {
      if (event.type === Event.PlaybackQueueEnded) {
        console.log("Playback queue ended");
        playNextTrack();
      } else if (
        event.type === Event.PlaybackTrackChanged &&
        event.nextTrack == null
      ) {
        console.log("Track finished");
        playNextTrack();
      }
    }
  );

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
        progress,
        queue,
        setQueue,
        playPreviousTrack,
        playNextTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContextProvider;
