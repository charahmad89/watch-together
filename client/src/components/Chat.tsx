import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Smile, ShieldCheck } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartReplies } from './SmartReplies';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function Chat() {
  const { messages, sendMessage, room, isHost, updatePlayback } = useWatchParty();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const currentTime = room?.playback_time || 0;
    sendMessage(inputValue, currentTime);
    setInputValue('');
  };

  const handleTimeClick = (timestamp: number) => {
    if (isHost && room) {
       updatePlayback(timestamp, room.is_playing);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary w-5 h-5" />
          <h3 className="font-semibold text-white">Live Chat</h3>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
          {messages.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
            <MessageSquare size={48} className="mb-2" />
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div 
              key={msg.id || idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white text-sm">{msg.user_name}</span>
                <button 
                  onClick={() => handleTimeClick(msg.video_timestamp)}
                  className="text-xs text-primary hover:text-accent transition-colors cursor-pointer font-medium bg-primary/10 px-1.5 rounded"
                >
                  {formatTime(msg.video_timestamp)}
                </button>
                <span className="text-xs text-gray-500 ml-auto">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl rounded-tl-none text-gray-200 text-sm leading-relaxed border border-white/5">
                {msg.text}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <SmartReplies onSelect={(text) => setInputValue(text)} />

      <form onSubmit={handleSubmit} className="p-4 bg-black/20 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-white/5 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 placeholder-white/20 transition-all"
          />
          <button
            type="button"
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <Smile size={18} />
          </button>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/20"
            disabled={!inputValue.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
