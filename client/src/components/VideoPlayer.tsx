import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipForward, SkipBack, Check, Subtitles } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../utils/format';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('1080p');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  const { room, isHost, updatePlayback } = useWatchParty();

  const lastEmitTime = useRef<number>(0);

  useEffect(() => {
    if (!videoRef.current || !room) return;

    const video = videoRef.current;
    const targetTime = room.playback_time;
    const diff = targetTime - video.currentTime;

    // 1. Play/Pause State Sync
    if (room.is_playing && video.paused) {
      video.play().catch(() => {});
    } else if (!room.is_playing && !video.paused) {
      video.pause();
    }

    // 2. Adaptive Sync Strategy
    if (Math.abs(diff) > 1.5) {
      // Hard Sync: If desync is > 1.5s, snap to target
      video.currentTime = targetTime;
      video.playbackRate = 1;
    } else if (Math.abs(diff) > 0.2) {
      // Soft Sync: If desync is 0.2s - 1.5s, speed up or slow down
      // If we are behind (diff > 0), speed up (1.05x)
      // If we are ahead (diff < 0), slow down (0.95x)
      video.playbackRate = diff > 0 ? 1.05 : 0.95;
    } else {
      // In Sync: Normal speed
      video.playbackRate = 1;
    }

  }, [room]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Throttle host updates to once per second to prevent socket flooding
      if (isHost && !video.paused) {
        const now = Date.now();
        if (now - lastEmitTime.current > 1000) {
          updatePlayback(video.currentTime, true);
          lastEmitTime.current = now;
        }
      }
    };

    const handleSeeked = () => {
      if (isHost) {
        updatePlayback(video.currentTime, !video.paused);
        lastEmitTime.current = Date.now();
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (isHost) {
        updatePlayback(video.currentTime, true);
        lastEmitTime.current = Date.now();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (isHost) {
        updatePlayback(video.currentTime, false);
        lastEmitTime.current = Date.now();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isHost, updatePlayback]);

  // Handle subtitles toggle
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const track = video.textTracks[0];
    if (track) {
      track.mode = subtitlesEnabled ? 'showing' : 'hidden';
    }
  }, [subtitlesEnabled, room?.subtitles_url]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !isHost) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    videoRef.current.volume = vol;
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden rounded-xl shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying && !showSettings) setShowControls(false);
        setShowSettings(false);
      }}
    >
      <video
        ref={videoRef}
        src={room?.movie_url}
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
        crossOrigin="anonymous"
      >
        {room?.subtitles_url && (
          <track
            kind="subtitles"
            src={room.subtitles_url}
            srcLang="en"
            label="English"
            default={subtitlesEnabled}
          />
        )}
      </video>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-6 pt-20"
          >
            {/* Progress Bar */}
            <div className="relative group/progress mb-4">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                disabled={!isHost}
                className={`w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-150 ${!isHost ? 'cursor-not-allowed opacity-50' : ''}`}
                style={{
                  background: `linear-gradient(to right, #7c3aed ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.2) ${(currentTime / duration) * 100}%)`
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayPause}
                  disabled={!isHost}
                  className={`p-2 rounded-full hover:bg-white/10 text-white transition-colors ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>

                <div className="flex items-center gap-2 group/volume relative">
                  <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full text-white">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                  </div>
                </div>

                <div className="text-sm font-medium text-white/90">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Settings Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 hover:bg-white/10 rounded-full text-white transition-transform ${showSettings ? 'rotate-45' : ''}`}
                  >
                    <Settings size={20} />
                  </button>
                  
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 w-56 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 p-2 shadow-xl overflow-hidden"
                      >
                         {/* Subtitles Toggle */}
                         {room?.subtitles_url && (
                           <div className="p-2 border-b border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-400 uppercase">Subtitles</span>
                              </div>
                              <button
                                  onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 text-sm text-white transition-colors"
                              >
                                  <div className="flex items-center gap-2">
                                      <Subtitles size={16} />
                                      <span>English</span>
                                  </div>
                                  {subtitlesEnabled && <Check size={14} className="text-primary" />}
                              </button>
                           </div>
                         )}

                         {/* Quality Selection */}
                         <div className="p-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400 uppercase">Quality</span>
                            </div>
                            {['1080p', '720p', '480p', 'Auto'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => {
                                        setQuality(q);
                                        setShowSettings(false);
                                    }}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 text-sm text-white transition-colors"
                                >
                                    <span>{q}</span>
                                    {quality === q && <Check size={14} className="text-primary" />}
                                </button>
                            ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full text-white">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
