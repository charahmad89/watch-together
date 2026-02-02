import { useEffect } from 'react';
import { LogOut, Share2, Film } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { VideoPlayer } from './VideoPlayer';
import { ParticipantsList } from './ParticipantsList';
import { ReactionBar } from './ReactionBar';
import { ReactionOverlay } from './ReactionOverlay';
import { Chat } from './Chat';
import { VoiceChat } from './VoiceChat';

export function WatchRoom() {
  const { room, leaveRoom } = useWatchParty();

  useEffect(() => {
    const handleBeforeUnload = () => {
      leaveRoom();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [leaveRoom]);

  const handleShare = async () => {
    const url = `${window.location.origin}?room=${room?.id}`;
    if (navigator.share) {
      await navigator.share({
        title: `Watch ${room?.movie_title} together`,
        text: `Join me to watch ${room?.movie_title}!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Room link copied to clipboard!');
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave the watch party?')) {
      await leaveRoom();
    }
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <ReactionOverlay />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-xl shadow-lg">
              <Film size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{room.movie_title}</h1>
              <p className="text-gray-400 text-sm">{room.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg"
            >
              <Share2 size={18} />
              Invite Friends
            </button>
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg"
            >
              <LogOut size={18} />
              Leave
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800" style={{ aspectRatio: '16/9' }}>
              <VideoPlayer />
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <VoiceChat />
            <ParticipantsList />
            <Chat />
          </div>
        </div>

        <div className="fixed bottom-8 right-8 z-40">
          <ReactionBar />
        </div>
      </div>
    </div>
  );
}
