import { useEffect, useState } from 'react';
import { LogOut, Share2, Film, MessageSquare, Users as UsersIcon, ChevronRight, ChevronLeft, Power } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { VideoPlayer } from './VideoPlayer';
import { ParticipantsList } from './ParticipantsList';
import { ReactionBar } from './ReactionBar';
import { ReactionOverlay } from './ReactionOverlay';
import { Chat } from './Chat';
import { VoiceChat } from './VoiceChat';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

import { SmartHypeOverlay } from './SmartHypeOverlay';

export function WatchRoom() {
  const { room, leaveRoom, isHost, endParty } = useWatchParty();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');

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

  const handleEndParty = async () => {
    if (confirm('Are you sure you want to end the party for everyone?')) {
      endParty();
    }
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <ReactionOverlay />
      <SmartHypeOverlay />

      <div className="flex-1 flex pt-16 h-[calc(100vh-64px)]">
        {/* Main Content - Video Player */}
        <div className="flex-1 flex flex-col relative bg-black">
          <div className="flex-1 relative">
            <VideoPlayer />
            
            {/* Reaction Bar Floating */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
              <ReactionBar />
            </div>
          </div>
          
          <div className="bg-card border-t border-white/5 p-4 flex items-center justify-between z-20">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Film size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{room.movie_title}</h1>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live
                    </span>
                    <span className="text-gray-400">
                      Hosted by <span className="text-white font-medium">{room.name}</span>
                    </span>
                  </div>
                </div>
             </div>

             <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleShare} size="sm">
                  <Share2 size={16} className="mr-2" />
                  Invite
                </Button>
                <Button variant="ghost" onClick={handleLeave} size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                  <LogOut size={16} className="mr-2" />
                  Leave
                </Button>
                {isHost && (
                  <Button variant="ghost" onClick={handleEndParty} size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold">
                    <Power size={16} className="mr-2" />
                    End Party
                  </Button>
                )}
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                  {isSidebarOpen ? <ChevronRight /> : <ChevronLeft />}
                </button>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-card border-l border-white/5 flex flex-col z-30 absolute md:relative right-0 h-full shadow-2xl"
            >
              {/* Sidebar Tabs */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'chat' ? 'text-primary' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Chat
                  </div>
                  {activeTab === 'chat' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'participants' ? 'text-primary' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <UsersIcon size={16} /> Participants
                  </div>
                  {activeTab === 'participants' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4 bg-background/50">
                <VoiceChat />
                
                <div className="flex-1 overflow-hidden rounded-xl bg-black/20 border border-white/5 relative">
                  {activeTab === 'chat' ? (
                    <div className="absolute inset-0">
                      <Chat />
                    </div>
                  ) : (
                    <div className="absolute inset-0 overflow-y-auto">
                      <ParticipantsList />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
