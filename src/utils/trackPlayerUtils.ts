import TrackPlayer, { Event } from "react-native-track-player";

//! =================================
//! REMOTE FUNCTIONS
//! =================================
export const handleRemoteNext = async () => {
  const trackIndex = await TrackPlayer.getCurrentTrack();
  const queue = await TrackPlayer.getQueue();
  const rate = await TrackPlayer.getRate();

  if (queue.length - 1 === trackIndex) {
    await TrackPlayer.skip(0);
    await TrackPlayer.pause();
  } else {
    await TrackPlayer.skipToNext();
  }
  TrackPlayer.setRate(rate);
};

export const handleRemotePrev = async () => {
  const trackIndex = await TrackPlayer.getCurrentTrack();
  const rate = await TrackPlayer.getRate();

  if (trackIndex === 0) {
    await TrackPlayer.seekTo(0);
  } else {
    await TrackPlayer.skipToPrevious();
  }
  TrackPlayer.setRate(rate);
};

export const PlaybackService = async () => {
  // This service needs to be registered for the module to work
  // but it will be used later in the "Receiving Events" section
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, handleRemoteNext);
  TrackPlayer.addEventListener(Event.RemotePrevious, handleRemotePrev);
  TrackPlayer.addEventListener(Event.RemoteSeek, (seek) =>
    TrackPlayer.seekTo(seek.position)
  );
};
