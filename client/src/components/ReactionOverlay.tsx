import { useEffect, useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import type { Reaction } from '../lib/supabase';

interface FloatingReaction extends Reaction {
  x: number;
  y: number;
  animationDelay: number;
}

export function ReactionOverlay() {
  const { reactions } = useWatchParty();
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (reactions.length === 0) return;

    const latestReaction = reactions[reactions.length - 1];
    const newFloating: FloatingReaction = {
      ...latestReaction,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      animationDelay: 0,
    };

    setFloatingReactions((prev) => [...prev, newFloating]);

    const timeout = setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== latestReaction.id));
    }, 4000);

    return () => clearTimeout(timeout);
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {floatingReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute text-6xl animate-float-up"
          style={{
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            animationDelay: `${reaction.animationDelay}ms`,
          }}
        >
          {reaction.emoji}
          <div className="text-xs text-white bg-black/70 px-2 py-1 rounded mt-1 text-center font-medium">
            {reaction.user_name}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-150px) scale(1.2);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
