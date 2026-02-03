import { useEffect, useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SmartRepliesProps {
  onSelect: (text: string) => void;
}

export function SmartReplies({ onSelect }: SmartRepliesProps) {
  const { messages } = useWatchParty();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // AI Logic: Simple Heuristic NLP for Contextual Suggestions
  useEffect(() => {
    if (messages.length === 0) {
      setSuggestions(['Hello everyone! 👋', 'What are we watching?', 'Hype! 🔥']);
      return;
    }

    const lastMsg = messages[messages.length - 1].text.toLowerCase();
    
    // Heuristic Rules
    const newSuggestions = [];

    if (lastMsg.includes('?') || lastMsg.includes('what') || lastMsg.includes('think')) {
      newSuggestions.push('Yes!', 'No', 'Not sure 🤔');
    }
    
    if (lastMsg.includes('lol') || lastMsg.includes('haha') || lastMsg.includes('funny')) {
      newSuggestions.push('😂😂😂', 'LMAO', 'Dead 💀');
    }

    if (lastMsg.includes('sad') || lastMsg.includes('cry') || lastMsg.includes('no way')) {
      newSuggestions.push('😢', 'Oh no...', 'Too sad 😭');
    }

    if (lastMsg.includes('cool') || lastMsg.includes('wow') || lastMsg.includes('amazing')) {
      newSuggestions.push('So good! 🔥', 'Insane 🤯', 'Cinema 🎥');
    }

    if (lastMsg.includes('boring') || lastMsg.includes('slow')) {
      newSuggestions.push('It gets better!', 'Skip? ⏭️', 'Sleeping 😴');
    }

    // Default fallbacks if no context matched
    if (newSuggestions.length === 0) {
      newSuggestions.push('True', 'Agreed', 'Wait for it...');
    }

    setSuggestions(newSuggestions.slice(0, 3));
  }, [messages]);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 px-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-1 mr-1 text-primary/70">
        <Sparkles size={12} />
        <span className="text-[10px] font-medium uppercase tracking-wider">AI Suggests</span>
      </div>
      {suggestions.map((text, idx) => (
        <motion.button
          key={text + idx}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(text)}
          className="bg-primary/10 hover:bg-primary/20 text-primary-foreground text-xs px-3 py-1.5 rounded-full border border-primary/20 transition-colors"
        >
          {text}
        </motion.button>
      ))}
    </div>
  );
}
