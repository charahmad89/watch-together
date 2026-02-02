import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';

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

    // Use current video time from room state
    const currentTime = room?.playback_time || 0;
    sendMessage(inputValue, currentTime);
    setInputValue('');
  };

  const handleTimeClick = (timestamp: number) => {
    if (isHost && room) {
       // If host, seek to that time
       updatePlayback(timestamp, room.is_playing);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare className="text-blue-500" size={20} />
        <h3 className="font-semibold text-white">Live Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No messages yet.</p>
            <p className="text-sm">Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white text-sm">{msg.user_name}</span>
                <button 
                  onClick={() => handleTimeClick(msg.video_timestamp)}
                  className="text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  @{formatTime(msg.video_timestamp)}
                </button>
                <span className="text-xs text-gray-500 ml-auto">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-300 text-sm break-words bg-gray-800/50 p-2 rounded-lg rounded-tl-none">
                {msg.text}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-gray-800 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
