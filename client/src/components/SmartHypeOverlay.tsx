import { useEffect, useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';

export function SmartHypeOverlay() {
  const { reactions } = useWatchParty();
  const [isHype, setIsHype] = useState(false);

  // AI Logic: Detect "Hype Moment" based on reaction density
  // If we see more than 5 reactions in the current buffer (5s window), it's a hype moment.
  useEffect(() => {
    if (reactions.length > 5) {
      setIsHype(true);
      const timer = setTimeout(() => setIsHype(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [reactions.length]);

  return (
    <AnimatePresence>
      {isHype && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-yellow-400/50 backdrop-blur-sm">
            <Flame className="animate-bounce" fill="currentColor" />
            <span className="font-bold text-lg italic tracking-wider">HYPE MOMENT!</span>
            <TrendingUp size={20} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
