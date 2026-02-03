import { Users, Crown, UserMinus } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { motion } from 'framer-motion';

export function ParticipantsList() {
  const { participants, room, currentUser, isHost, kickUser } = useWatchParty();

  if (!room) return null;

  return (
    <div className="flex flex-col gap-3">
      {participants.map((participant, idx) => {
        const isParticipantHost = participant.user_name === room.host_id;
        const isCurrentUser = participant.user_name === currentUser;

        return (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all border group/item ${
              isParticipantHost 
                ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
                : isCurrentUser
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 ${
                  isParticipantHost 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-300/50' 
                    : 'bg-gradient-to-br from-primary to-accent border-transparent'
                }`}
              >
                {participant.user_name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  participant.is_online ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${isParticipantHost ? 'text-yellow-200' : 'text-white'}`}>
                  {participant.user_name}
                  {isCurrentUser && ' (You)'}
                </p>
                {isParticipantHost && (
                  <Crown size={14} className="text-yellow-500 flex-shrink-0 fill-current drop-shadow-sm" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${participant.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
                 <p className={`text-xs ${participant.is_online ? 'text-green-400' : 'text-gray-500'}`}>
                    {participant.is_online ? 'Online' : 'Offline'}
                 </p>
              </div>
            </div>
            
            {isHost && !isCurrentUser && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to kick ${participant.user_name}?`)) {
                    kickUser(participant.id);
                  }
                }}
                className="opacity-0 group-hover/item:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg"
                title="Kick user"
              >
                <UserMinus size={16} />
              </button>
            )}
          </motion.div>
        );
      })}

      {participants.length === 1 && (
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 text-center">
          <p className="text-gray-400 text-sm">
            Waiting for others to join...
          </p>
        </div>
      )}
    </div>
  );
}
