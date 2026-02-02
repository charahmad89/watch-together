import { useState } from 'react';
import { Smile } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';

const EMOJI_OPTIONS = ['😂', '😱', '😢', '❤️', '🔥', '👏', '😍', '🤔', '😮', '💀'];

export function ReactionBar() {
  const [showPicker, setShowPicker] = useState(false);
  const { addReaction, room } = useWatchParty();

  const handleReaction = (emoji: string) => {
    const video = document.querySelector('video');
    const currentTime = video?.currentTime || 0;
    addReaction(emoji, currentTime);
    setShowPicker(false);
  };

  if (!room) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors shadow-lg"
        title="React to this moment"
      >
        <Smile size={24} />
      </button>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-full mb-2 right-0 bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-700 z-50">
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-3xl hover:scale-125 transition-transform p-2 hover:bg-gray-800 rounded-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
