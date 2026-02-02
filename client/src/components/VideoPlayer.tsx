import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  const { room, isHost, updatePlayback } = useWatchParty();

  useEffect(() => {
    if (!videoRef.current || !room) return;

    const video = videoRef.current;

    if (Math.abs(video.currentTime - room.playback_time) > 2) {
      video.currentTime = room.playback_time;
    }

    if (room.is_playing && video.paused) {
      video.play().catch(() => {});
    } else if (!room.is_playing && !video.paused) {
      video.pause();
    }
  }, [room?.current_time, room?.is_playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isHost && !video.paused) {
        updatePlayback(video.currentTime, true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (isHost) {
        updatePlayback(video.currentTime, true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (isHost) {
        updatePlayback(video.currentTime, false);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isHost, updatePlayback]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlayPause = () => {
    if (!videoRef.current || !isHost) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !isHost) return;

    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    updatePlayback(time, !videoRef.current.paused);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.parentElement?.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!room) return null;

  return (
    <div
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={room.movie_url}
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={!isHost}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-4 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`,
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              disabled={!isHost}
              className="text-white hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isHost ? "Only the host can control playback" : ""}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>

            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-red-500 transition-colors"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-red-500 transition-colors"
            >
              <Maximize size={24} />
            </button>
          </div>
        </div>

        {!isHost && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm font-medium">
            Only the host can control playback
          </div>
        )}
      </div>
    </div>
  );
}
