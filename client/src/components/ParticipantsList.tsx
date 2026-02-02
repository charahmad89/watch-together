import { Users, Crown } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';

export function ParticipantsList() {
  const { participants, room, currentUser } = useWatchParty();

  if (!room) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-600 p-2 rounded-lg">
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Watching Together</h3>
          <p className="text-gray-400 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3">
        {participants.map((participant) => {
          const isHost = participant.user_name === room.host_id;
          const isCurrentUser = participant.user_name === currentUser;

          return (
            <div
              key={participant.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isCurrentUser
                  ? 'bg-red-600/20 border border-red-600/50'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    isHost ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'
                  }`}
                >
                  {participant.user_name.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                    participant.is_online ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">
                    {participant.user_name}
                    {isCurrentUser && ' (You)'}
                  </p>
                  {isHost && (
                    <Crown size={16} className="text-yellow-500 flex-shrink-0" title="Host" />
                  )}
                </div>
                <p className="text-gray-400 text-xs">
                  {participant.is_online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {participants.length === 1 && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            Share the room link with friends to watch together!
          </p>
        </div>
      )}
    </div>
  );
}
